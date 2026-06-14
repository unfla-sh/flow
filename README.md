# Flow

**Live:** [flow.unfla.sh](https://flow.unfla.sh) · **Repo:** [unfla-sh/flow](https://github.com/unfla-sh/flow)

**Flow is a browser-based, hierarchical workflow editor** built with React, React Flow and shadcn/ui-style components. It's a three-panel low-code canvas for designing, documenting and reviewing process flows — with rich node types, nested sub-flows, a step-through simulator, live validation, Mermaid/AI import, and full save / load / export / share. Everything runs client-side; nothing is sent to a server.

It sits in the same space as n8n, Node-RED and Retool's flow builders, but is deliberately lighter — a fast, self-contained **design and documentation tool** rather than an execution engine.

### Who it's for

Anyone who needs to **map a process clearly without standing up infrastructure**: solutions engineers and analysts diagramming integrations, product/ops teams documenting decision logic, engineers sketching pipelines and sub-systems, and educators or technical writers who want an interactive, shareable diagram instead of a static image.

## Features

### Canvas & nodes
- **Three-panel layout** — searchable, categorized node palette (with **Favorites** & **Recently-used**) · React Flow canvas (zoom/pan/minimap) · context-aware properties panel. Both sidebars resize & collapse.
- **Node types** — Start/End, Script, Data (fetch/transform/output), Form (with a field builder: text, number, date, date-range, select, multi-select, checkbox), Condition (true/false), **Switch / Case** (one handle per case + default), Decision (diamond), Sub-Flow, plus Loop / Delay / Error-Handler controls and **Note / Frame / Media** annotations.
- **Connections** — drag between nodes; every node also exposes **mid-of-side handles** (top/bottom/left/right) so you can wire into a node's middle. A link drawn between two mid handles defaults to a **two-way arrow** (e.g. web ⇄ db); toggle one/two-way from the edge menu or Style tab. Edges support labels, colour, width, arrow size, **right-angle (step) or curved routing**, and manual bend points.
- **Styling** — per-node icon (95-icon registry incl. animals/sleep/etc.), custom **icon background** and **text colour**, border/fill/border-style; **dark mode** toggle.
- **Arrange** — multi-select (Shift), align (left/centre/right/top/middle/bottom), distribute, dagre **auto-layout**, and LR ⇄ TB flow direction.

### Editing & flow
- **Edit ops** — copy / cut / paste / duplicate / delete (toolbar, right-click menus, keyboard), paste-at-cursor, **Replace type** (keeps label + connections).
- **Sub-flows** — double-click a Sub-Flow node to drill in; toolbar breadcrumbs navigate back; copying a sub-flow deep-copies its inner graph.
- **Undo / redo** — grouped so a drag is one step.
- **Simulation** — Play / Step / Stop in the toolbar walks the graph, highlighting the active node & edges (step badge in the toolbar).
- **Validation** — a lint indicator flags missing start/end, orphan/unreachable nodes, dangling edges, and unwired branch outputs; click an issue to jump to the node.
- **Presentation lock** — a read-only mode (handles/editing hidden) where the properties panel stays inspectable.

### Save / share / generate
- **Save / load** — named workflows in browser storage (File ▸ Save / Open) + an autosaved draft so a refresh never loses work (with a storage-full warning). Export/Import `.flow.json` files (schema-validated) and Export PNG.
- **Import from Mermaid** — paste a `flowchart`/`graph` (or a `.md` with a ```mermaid block); shapes map to node types, `{diamonds}` → decision, subgraphs → frames, `<-->` → two-way, auto-laid-out.
- **Generate with AI** — describe a pipeline, copy the generated prompt into **any** chat assistant (Poe, ChatGPT, Claude.ai, Gemini…), and paste its JSON answer back. No API key, no provider config, nothing sent from the app — safest path, works with whatever you already use. The same prompt embeds the `.flow.json` schema, so an agent (Claude Code/Codex) can emit a file directly too.
- **Templates** — File ▸ New from template ▸ four **feature-tour** templates (Basics & Forms · Branching & Data · Sub-flows, Links & Style · Phases, Loops & Step Arrows) that collectively demonstrate every component.

| Shortcut | Action |
| --- | --- |
| Ctrl+C / X / V | Copy / cut / paste |
| Ctrl+D | Duplicate |
| Del / Backspace | Delete selection |
| Ctrl+Z / Ctrl+Shift+Z | Undo / redo |
| Ctrl+S | Save |
| Shift+click / Shift+drag | Multi-select |

## Development

```sh
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run lint     # eslint
npm test         # vitest unit tests
```

## Deployment

Flow is a fully static single-page app, so any static host works. A GitHub
Actions workflow (`.github/workflows/deploy.yml`) builds and publishes to
**GitHub Pages** on every push to `main` — just enable Pages (Settings ▸ Pages ▸
Source: GitHub Actions).

It's served from the custom domain **[flow.unfla.sh](https://flow.unfla.sh)** via
`public/CNAME`, so Vite's `base` stays `/`. Point the domain at GitHub Pages with
a DNS `CNAME` record (`flow` → `unfla-sh.github.io`), then set it under
Settings ▸ Pages ▸ Custom domain. To host at `github.io/<repo>/` instead, set
`BASE_PATH: /<repo>/` on the build step and remove `public/CNAME`.

## Notes
- **Private templates**: `src/data/templates/private/` and `workflows/` are git-ignored — drop organisation-specific templates there (each `*.templates.ts` exporting `templates: WorkflowTemplate[]`) and they load locally but never get pushed. The committed showcase tours are safe to publish.

## License

[MIT](./LICENSE)
