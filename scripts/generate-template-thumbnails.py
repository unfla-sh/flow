#!/usr/bin/env python3
"""Render a thumbnail for every bundled template into public/template-thumbs/.

The template browser shows these; "Medallion" or "DP integration" means
nothing as bare text. Rendering them from the real templates (rather than
drawing them by hand) means a thumbnail can never drift from its diagram.

Run after changing templates:

    python3 scripts/generate-template-thumbnails.py

It starts its own Vite dev server, loads each template through the editor's
own draft-restore path, hides the canvas chrome, fits the diagram, and saves
a WebP. Needs Playwright and Pillow, and a Chrome/Chromium on the box.
"""
from __future__ import annotations

import io
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / 'public' / 'template-thumbs'
PORT = 5177
BASE = f'http://localhost:{PORT}/app/'
# Rendered large, downscaled to this — keeps text crisp on retina cards.
SHOT = (1280, 800)
THUMB = (640, 400)


# Union of everything drawn on the canvas, in CSS pixels relative to it.
CONTENT_BOX_JS = """() => {
  const canvas = document.querySelector('.react-flow').getBoundingClientRect()
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  const selectors = ['.react-flow__node', '.react-flow__edge-path', '.workflow-edge-label']
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      left = Math.min(left, rect.left); top = Math.min(top, rect.top)
      right = Math.max(right, rect.right); bottom = Math.max(bottom, rect.bottom)
    }
  }
  if (!Number.isFinite(left)) return null
  return {
    left: left - canvas.left, top: top - canvas.top,
    right: right - canvas.left, bottom: bottom - canvas.top,
    // The side panels shrink the canvas, so the screenshot's pixel-per-CSS-pixel
    // ratio has to come from the canvas itself, not the browser viewport.
    canvasWidth: canvas.width,
  }
}"""

# Breathing room around the diagram, in CSS pixels.
PAD = 20


def crop_to_content(image: Image.Image, box: dict | None) -> Image.Image:
    """Crop a canvas screenshot down to the drawn diagram plus a small margin."""
    if not box:
        return image
    # The box is in CSS pixels; the shot is larger by the device scale factor.
    scale = image.width / box['canvasWidth']
    left = max(0, int((box['left'] - PAD) * scale))
    top = max(0, int((box['top'] - PAD) * scale))
    right = min(image.width, int((box['right'] + PAD) * scale))
    bottom = min(image.height, int((box['bottom'] + PAD) * scale))
    if right - left < 40 or bottom - top < 40:
        return image
    return image.crop((left, top, right, bottom))


def letterbox(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Scale to fit inside `size`, centred on white — every card the same shape."""
    fitted = image.copy()
    fitted.thumbnail(size, Image.LANCZOS)
    canvas = Image.new('RGB', size, 'white')
    canvas.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return canvas


def find_chrome() -> str | None:
    for name in ('google-chrome', 'chromium', 'chromium-browser'):
        path = shutil.which(name)
        if path:
            return path
    return None


def wait_for_server(timeout: float = 60.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket() as probe:
            if probe.connect_ex(('127.0.0.1', PORT)) == 0:
                return
        time.sleep(0.25)
    raise SystemExit(f'dev server did not come up on port {PORT}')


def main() -> int:
    chrome = find_chrome()
    if not chrome:
        raise SystemExit('no Chrome/Chromium found; install one or set PATH')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    server = subprocess.Popen(
        ['npx', 'vite', '--port', str(PORT), '--strictPort'],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    try:
        wait_for_server()
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=chrome, args=['--no-sandbox'])
            failures: list[str] = []

            probe = browser.new_page()
            probe.goto(BASE)
            probe.wait_for_selector('.react-flow', timeout=30000)
            # Vite transpiles TS on request, so the page can read the real
            # template list — no separate bundling step for this script.
            templates = probe.evaluate('''async () => {
              // Resolve against the page so the Vite `base` path is honoured.
              const url = new URL('src/data/templates/index.ts', document.baseURI).href
              const mod = await import(/* @vite-ignore */ url)
              // docName is what the toolbar shows; a menu entry may be titled differently.
              return mod.templates.map((t) => ({
                id: t.id, name: t.name, docName: t.doc.settings.name, doc: t.doc,
              }))
            }''')
            probe.close()
            print(f'{len(templates)} templates')

            for index, template in enumerate(templates, 1):
                draft = json.dumps({
                    'doc': template['doc'],
                    'currentWorkflowId': None,
                    'dirty': False,
                    'savedAt': '2026-01-01T00:00:00.000Z',
                })
                # A fresh context per template: the editor saves the live doc
                # back to the draft key on unload, so seeding the key and then
                # reloading the same page would race against that save.
                context = browser.new_context(
                    viewport={'width': SHOT[0], 'height': SHOT[1]},
                    device_scale_factor=2,
                )
                context.add_init_script(
                    f'localStorage.setItem("wf:draft", {json.dumps(draft)})'
                )
                page = context.new_page()
                page.goto(BASE)
                page.wait_for_selector('.react-flow__node', timeout=30000)
                page.wait_for_timeout(700)
                # Fit first: the export class hides the controls that do it.
                page.locator('.react-flow__controls-fitview').first.click()
                page.wait_for_timeout(400)
                # Same class the PNG export uses: drops controls, minimap and handles.
                page.evaluate('() => document.body.classList.add("workflow-exporting")')
                page.wait_for_timeout(250)

                title = page.locator('nav span.font-semibold').first.inner_text()
                nodes = page.locator('.react-flow__node').count()
                if nodes == 0 or title.strip() != template['docName'].strip():
                    failures.append(
                        f'{template["id"]}: {nodes} nodes, title {title!r} '
                        f'(expected {template["docName"]!r})'
                    )
                    context.close()
                    continue

                # Fit-view centres the diagram in a 16:10 viewport, so a wide,
                # short graph ends up swimming in empty canvas. Crop to what is
                # actually drawn, then letterbox that into the thumbnail box.
                box = page.evaluate(CONTENT_BOX_JS)
                png = page.locator('.react-flow').first.screenshot(type='png')
                image = Image.open(io.BytesIO(png)).convert('RGB')
                image = crop_to_content(image, box)
                image = letterbox(image, THUMB)
                target = OUT_DIR / f'{template["id"]}.webp'
                image.save(target, 'WEBP', quality=82, method=6)
                context.close()
                print(f'{index:2d}/{len(templates)} {template["id"]:<28} '
                      f'{nodes:2d} nodes  {target.stat().st_size // 1024:3d} KB')

            browser.close()
    finally:
        os.killpg(os.getpgid(server.pid), signal.SIGTERM)
        server.wait(timeout=10)

    total = sum(f.stat().st_size for f in OUT_DIR.glob('*.webp'))
    print(f'\n{len(list(OUT_DIR.glob("*.webp")))} thumbnails, {total // 1024} KB total')
    if failures:
        print('\nFAILED:', *failures, sep='\n  ')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
