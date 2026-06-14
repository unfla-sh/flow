import { finalizeImportedDoc } from '@/lib/autoLayout'
import type { ParseResult } from '@/lib/workflowFile'
import {
  ROOT_FLOW_ID,
  type FlowDirection,
  type NodeTypeId,
  type WorkflowEdge,
  type WorkflowNode,
} from '@/types/workflow'

/** Pull the first ```mermaid fenced block out of markdown, else return the text. */
function extractMermaid(input: string): string {
  const fence = input.match(/```mermaid\s*\n([\s\S]*?)```/i)
  if (fence) return fence[1].trim()
  return input.trim()
}

interface ShapeMatch {
  label: string
  type: NodeTypeId
}

/** Match a node declaration body `id<shape>` starting at the given id token. */
function parseShape(rest: string): { shape: ShapeMatch; length: number } | null {
  // Ordered longest-delimiter-first so e.g. ([ ]) isn't read as ( ).
  const patterns: { open: string; close: string; type: ShapeMatch['type'] | 'auto' }[] = [
    { open: '([', close: '])', type: 'auto' }, // stadium → start/end
    { open: '[(', close: ')]', type: 'data' }, // cylinder
    { open: '((', close: '))', type: 'auto' }, // circle
    { open: '{{', close: '}}', type: 'condition' }, // hexagon
    { open: '[', close: ']', type: 'rect' as 'auto' }, // rectangle (script/data)
    { open: '(', close: ')', type: 'rect' as 'auto' }, // rounded
    { open: '{', close: '}', type: 'decision' }, // diamond
  ]
  for (const p of patterns) {
    if (!rest.startsWith(p.open)) continue
    const end = rest.indexOf(p.close, p.open.length)
    if (end === -1) continue
    const raw = rest.slice(p.open.length, end).trim()
    const label = raw.replace(/^["']|["']$/g, '')
    const type = resolveType(p.type, label, p.open)
    return { shape: { label, type }, length: end + p.close.length }
  }
  return null
}

function resolveType(declared: ShapeMatch['type'] | 'auto', label: string, open: string): NodeTypeId {
  if (declared === 'condition') return 'condition'
  if (declared === 'decision') return 'decision'
  if (declared === 'data') return 'data'
  if (declared === 'auto' || (declared as string) === 'rect') {
    // stadium / circle → start or end by label; rectangles → script if command-like
    if (open === '([' || open === '((') {
      if (/^(start|begin|trigger|cron|input)/i.test(label)) return 'start'
      if (/(end|done|stop|finish|output|complete)/i.test(label)) return 'end'
      return 'data'
    }
    if (/\.(py|js|ts|sh|rb)\b/i.test(label) || /\b(run|exec|script|build|deploy)\b/i.test(label)) {
      return 'script'
    }
    return 'data'
  }
  return 'data'
}

const ID_RE = '[A-Za-z0-9_.-]+'
// src-id, src-shape?, connector, |label|?, tgt-id, tgt-shape?
const EDGE_RE = new RegExp(
  `^(${ID_RE})(.*?)\\s*(<-->|<-.->|<==>|-\\.->|==>|-->|---|--[^>]*-->|--[^>]*---)\\s*(\\|[^|]*\\|)?\\s*(${ID_RE})(.*)$`,
)

interface Parsed {
  nodes: Map<string, WorkflowNode>
  edges: WorkflowEdge[]
  order: string[]
}

function ensureNode(state: Parsed, id: string, shape?: ShapeMatch) {
  const existing = state.nodes.get(id)
  if (existing) {
    if (shape) {
      existing.data.label = shape.label
      existing.data.nodeType = shape.type
      existing.type = shape.type
    }
    return
  }
  const label = shape?.label ?? id
  const type = shape?.type ?? 'data'
  state.nodes.set(id, {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label, nodeType: type, params: {} },
  })
  state.order.push(id)
}

/** Pull an edge label out of `|text|` (preferred) or `-- text -->`. */
function edgeLabel(connector: string, pipe: string | undefined): string {
  if (pipe) return pipe.replace(/^\||\|$/g, '').trim()
  const dashed = connector.match(/--\s*([^>-][^->]*?)\s*--/)
  if (dashed) return dashed[1].trim()
  return ''
}

/** Map a branch label to a condition node's true/false source handle. */
function conditionHandle(label: string): string | undefined {
  const l = label.toLowerCase().trim()
  if (/^(yes|true|y|ok|pass)$/.test(l)) return 'true'
  if (/^(no|false|n|fail)$/.test(l)) return 'false'
  return undefined
}

export function parseMermaid(input: string): ParseResult {
  const body = extractMermaid(input)
  if (!body) return { ok: false, error: 'Nothing to import — the text was empty.' }

  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'))

  const header = lines[0] ?? ''
  const headerMatch = header.match(/^(flowchart|graph)\s+(LR|RL|TB|TD|BT)?/i)
  if (!headerMatch) {
    return {
      ok: false,
      error: 'Only Mermaid "flowchart" / "graph" diagrams are supported (e.g. `flowchart LR`).',
    }
  }
  const dir = (headerMatch[2] ?? 'LR').toUpperCase()
  const direction: FlowDirection = dir === 'TB' || dir === 'TD' || dir === 'BT' ? 'tb' : 'lr'

  const state: Parsed = { nodes: new Map(), edges: [], order: [] }
  // Track subgraph membership: title → member ids.
  const subgraphs: { title: string; ids: Set<string> }[] = []
  const stack: { title: string; ids: Set<string> }[] = []

  const noteMembership = (id: string) => {
    for (const frame of stack) frame.ids.add(id)
  }

  for (const line of lines.slice(1)) {
    const sg = line.match(/^subgraph\s+(.*)$/i)
    if (sg) {
      const title = sg[1].replace(/^["']|["']$/g, '').replace(/\[.*\]$/, '').trim() || 'Group'
      const frame = { title, ids: new Set<string>() }
      subgraphs.push(frame)
      stack.push(frame)
      continue
    }
    if (/^end$/i.test(line)) {
      stack.pop()
      continue
    }

    const edge = line.match(EDGE_RE)
    if (edge) {
      const [, srcId, srcShapeRaw, connector, pipe, tgtId, tail] = edge
      ensureNode(state, srcId, parseShape(srcShapeRaw.trim())?.shape)
      noteMembership(srcId)
      ensureNode(state, tgtId, parseShape(tail.trim())?.shape)
      noteMembership(tgtId)
      const label = edgeLabel(connector, pipe)
      const srcType = state.nodes.get(srcId)?.data.nodeType
      const sourceHandle =
        srcType === 'condition' || srcType === 'decision' ? conditionHandle(label) : undefined
      state.edges.push({
        id: crypto.randomUUID(),
        source: srcId,
        target: tgtId,
        ...(sourceHandle ? { sourceHandle } : {}),
        ...(label ? { label } : {}),
        ...(connector.startsWith('-.') ? { animated: true } : {}),
        data: {
          style: connector.startsWith('<')
            ? { arrow: true, arrowStart: true }
            : { arrow: connector.includes('>') },
        },
      })
      continue
    }

    // Standalone node declaration: `id[Label]`
    const idMatch = line.match(new RegExp(`^(${ID_RE})(.*)$`))
    if (idMatch) {
      const [, id, restRaw] = idMatch
      const shape = parseShape(restRaw.trim())
      ensureNode(state, id, shape?.shape)
      noteMembership(id)
    }
  }

  if (state.nodes.size === 0) {
    return { ok: false, error: 'No nodes found in the diagram.' }
  }

  const nodes: WorkflowNode[] = state.order.map((id) => state.nodes.get(id)!)

  // Each non-empty subgraph becomes a frame node; positioned after layout below.
  const frames = subgraphs.filter((s) => s.ids.size > 0)

  const doc = finalizeImportedDoc({
    schemaVersion: 1,
    settings: { name: 'Imported from Mermaid', version: '0.1.0', description: '' },
    flows: { [ROOT_FLOW_ID]: { nodes, edges: state.edges, settings: { direction } } },
  })

  // After layout, wrap each subgraph's members in a frame box.
  if (frames.length > 0) {
    const laid = doc.flows[ROOT_FLOW_ID].nodes
    const byId = new Map(laid.map((n) => [n.id, n]))
    const PAD = 28
    const frameNodes: WorkflowNode[] = []
    frames.forEach((frame, i) => {
      const members = [...frame.ids].map((id) => byId.get(id)).filter(Boolean) as WorkflowNode[]
      if (members.length === 0) return
      const minX = Math.min(...members.map((m) => m.position.x))
      const minY = Math.min(...members.map((m) => m.position.y))
      const maxX = Math.max(...members.map((m) => m.position.x + (m.width ?? 208)))
      const maxY = Math.max(...members.map((m) => m.position.y + (m.height ?? 110)))
      frameNodes.push({
        id: `frame-${i}-${crypto.randomUUID().slice(0, 8)}`,
        type: 'frame',
        position: { x: minX - PAD, y: minY - PAD - 24 },
        width: maxX - minX + PAD * 2,
        height: maxY - minY + PAD * 2 + 24,
        zIndex: -1,
        data: { label: frame.title, nodeType: 'frame', params: {} },
      })
    })
    doc.flows[ROOT_FLOW_ID].nodes = [...frameNodes, ...laid]
  }

  return { ok: true, doc }
}
