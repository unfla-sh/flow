import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import { toPng } from 'html-to-image'

import { clearShareHash, hasSharedDoc, readSharedDoc } from '@/lib/share'
import { APP_VERSION } from '@/lib/version'
import { parseWorkflowFile, sanitizeDoc, serializeDoc } from '@/lib/workflowFile'
import { clearHistory, useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowDoc } from '@/types/workflow'

const INDEX_KEY = 'wf:index'
const DOC_PREFIX = 'wf:doc:'
const DRAFT_KEY = 'wf:draft'

export interface WorkflowMeta {
  id: string
  name: string
  updatedAt: string
}

/**
 * localStorage.setItem that surfaces quota failures instead of losing data
 * silently. On failure it fires a `wf:storage-error` event (the toolbar shows
 * a dialog) and returns false.
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    const message =
      err instanceof Error && /quota|exceeded/i.test(err.message)
        ? 'Browser storage is full — this workflow was not saved. Export it to a JSON file instead, or delete old saved workflows.'
        : 'Could not write to browser storage.'
    window.dispatchEvent(new CustomEvent('wf:storage-error', { detail: message }))
    return false
  }
}

function readIndex(): WorkflowMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as WorkflowMeta[]) : []
  } catch {
    return []
  }
}

function writeIndex(index: WorkflowMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function listWorkflows(): WorkflowMeta[] {
  return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Save the current doc under its existing id, or a new one. Returns the id. */
export function saveCurrentWorkflow(asNewName?: string): string {
  const state = useWorkflowStore.getState()
  if (asNewName && asNewName.trim() && asNewName.trim() !== state.doc.settings.name) {
    state.updateSettings({ name: asNewName.trim() })
  }
  const fresh = useWorkflowStore.getState()
  const id = asNewName ? crypto.randomUUID() : (fresh.currentWorkflowId ?? crypto.randomUUID())
  if (!safeSetItem(DOC_PREFIX + id, serializeDoc(fresh.doc))) return id
  const meta: WorkflowMeta = {
    id,
    name: fresh.doc.settings.name,
    updatedAt: new Date().toISOString(),
  }
  writeIndex([meta, ...readIndex().filter((m) => m.id !== id)])
  fresh.markSaved(id)
  return id
}

export function loadWorkflowById(id: string): boolean {
  const raw = localStorage.getItem(DOC_PREFIX + id)
  if (!raw) return false
  const parsed = parseWorkflowFile(raw)
  if (!parsed.ok) return false
  useWorkflowStore.getState().loadDoc(parsed.doc, id)
  clearHistory()
  return true
}

export function deleteWorkflow(id: string) {
  localStorage.removeItem(DOC_PREFIX + id)
  writeIndex(readIndex().filter((m) => m.id !== id))
  const state = useWorkflowStore.getState()
  if (state.currentWorkflowId === id) {
    useWorkflowStore.setState({ currentWorkflowId: null })
  }
}

/** Load a bundled template (or imported doc) as a new, unsaved workflow. */
export function loadDocAsNew(doc: WorkflowDoc) {
  useWorkflowStore.getState().loadDoc(doc, null)
  clearHistory()
  useWorkflowStore.setState({ dirty: true })
}

// ---------------------------------------------------------------------------
// Draft autosave — the current doc survives a page refresh without saving.

interface Draft {
  doc: WorkflowDoc
  currentWorkflowId: string | null
  dirty: boolean
  savedAt: string
}

let draftTimer: ReturnType<typeof setTimeout> | null = null

function saveDraft() {
  const state = useWorkflowStore.getState()
  const draft: Draft = {
    doc: sanitizeDoc(state.doc),
    currentWorkflowId: state.currentWorkflowId,
    dirty: state.dirty,
    savedAt: new Date().toISOString(),
  }
  safeSetItem(DRAFT_KEY, JSON.stringify(draft))
}

function restoreDraft(): boolean {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    const draft = JSON.parse(raw) as Draft
    const parsed = parseWorkflowFile(JSON.stringify(draft.doc))
    if (!parsed.ok) return false
    const store = useWorkflowStore.getState()
    store.loadDoc(parsed.doc, draft.currentWorkflowId)
    useWorkflowStore.setState({ dirty: draft.dirty })
    clearHistory()
    return true
  } catch {
    return false
  }
}

/** Call once at startup: load a shared link if present, else the draft, then autosave. */
export function initPersistence() {
  if (hasSharedDoc()) {
    // Decoding (gunzip) is async; load the shared doc once it resolves,
    // falling back to the draft if the link is invalid.
    void readSharedDoc().then((shared) => {
      if (shared?.ok) {
        loadDocAsNew(shared.doc)
        clearShareHash()
      } else {
        restoreDraft()
      }
    })
  } else {
    restoreDraft()
  }
  useWorkflowStore.subscribe((state, prev) => {
    if (
      state.doc === prev.doc &&
      state.currentWorkflowId === prev.currentWorkflowId &&
      state.dirty === prev.dirty
    ) {
      return
    }
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(saveDraft, 800)
  })
  window.addEventListener('beforeunload', (event) => {
    if (draftTimer) {
      clearTimeout(draftTimer)
      saveDraft()
    }
    if (useWorkflowStore.getState().dirty) {
      event.preventDefault()
    }
  })
}

// ---------------------------------------------------------------------------
// File import / export

function downloadFile(filename: string, href: string) {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
}

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'workflow'
}

export function exportToJsonFile() {
  const { doc } = useWorkflowStore.getState()
  const stamped: WorkflowDoc = {
    ...doc,
    meta: { appVersion: APP_VERSION, exportedAt: new Date().toISOString() },
  }
  const blob = new Blob([serializeDoc(stamped)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  downloadFile(`${safeFilename(doc.settings.name)}.flow.json`, url)
  URL.revokeObjectURL(url)
}

export async function importFromJsonFile(file: File): Promise<{ ok: boolean; error?: string }> {
  const text = await file.text()
  const parsed = parseWorkflowFile(text)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  loadDocAsNew(parsed.doc)
  return { ok: true }
}

export async function exportToPng(): Promise<{ ok: boolean; error?: string }> {
  const state = useWorkflowStore.getState()
  const flowId = state.activeFlowPath[state.activeFlowPath.length - 1]
  const nodes = state.doc.flows[flowId]?.nodes ?? []
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (nodes.length === 0 || !viewportEl) {
    return { ok: false, error: 'Nothing to export on this canvas.' }
  }
  const bounds = getNodesBounds(nodes)
  const imageWidth = Math.max(800, Math.min(2400, Math.round(bounds.width * 1.25)))
  const imageHeight = Math.max(600, Math.min(1800, Math.round(bounds.height * 1.25)))
  const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.2, 2, 0.08)
  try {
    document.body.classList.add('workflow-exporting')
    const dataUrl = await toPng(viewportEl, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    })
    downloadFile(`${safeFilename(state.doc.settings.name)}.png`, dataUrl)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'PNG export failed' }
  } finally {
    document.body.classList.remove('workflow-exporting')
  }
}
