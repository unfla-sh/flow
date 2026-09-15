/**
 * "Change this diagram" prompts: the model gets the current document and an
 * instruction, and answers with the full updated document. Rewriting the whole
 * doc keeps the contract identical to generation (one JSON document in, the
 * existing parser and validator out) at the cost of echoing unchanged nodes.
 */
import { finalizeImportedDoc } from '@/lib/autoLayout'
import { sanitizeDoc } from '@/lib/workflowFile'
import { normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import type { FlowGraph, WorkflowDoc, WorkflowNode } from '@/types/workflow'

import { FLOW_SCHEMA_PROMPT } from './flowSchemaPrompt'
import { parseGeneratedText } from './generateFlow'

export const MODIFY_RULES = `You are editing an EXISTING diagram. The user will give you the current JSON document and a change request.
Apply the change and respond with the complete updated JSON document (same schema as above), and nothing else.
Editing rules:
- Keep every node and edge the user did not ask to change exactly as it is: same ids, same positions, same params, same styles, same edge routes.
- Reuse existing node ids when you refer to existing nodes; give new nodes and edges new unique ids.
- Put new nodes at position {"x":0,"y":0} unless the request says where they go; the editor places them next to the nodes they connect to.
- When deleting a node, also delete the edges attached to it.
- Keep "settings", "schemaVersion" and every flow that you did not touch.`

export function buildModifyMessages(
  doc: WorkflowDoc,
  instruction: string,
): { system: string; user: string } {
  return {
    system: `${FLOW_SCHEMA_PROMPT}\n\n${MODIFY_RULES}`,
    user: `Current diagram JSON:\n${JSON.stringify(sanitizeDoc(doc))}\n\nChange request: ${instruction.trim()}\n\nRespond with ONLY the full updated JSON document.`,
  }
}

/** The complete prompt to paste into any chat assistant. */
export function buildFullModifyPrompt(doc: WorkflowDoc, instruction: string): string {
  const { system, user } = buildModifyMessages(doc, instruction)
  return `${system}\n\n${user}`
}

/** Gap between a new node and the node it was attached to. */
const STEP_X = 280
const STEP_Y = 160
/** Nodes closer than this on both axes are treated as stacked on each other. */
const OVERLAP = 40

function overlaps(a: { x: number; y: number }, nodes: WorkflowNode[]): boolean {
  return nodes.some(
    (node) => Math.abs(node.position.x - a.x) < OVERLAP && Math.abs(node.position.y - a.y) < OVERLAP,
  )
}

/** Nudge `wanted` along the cross axis until it no longer sits on another node. */
function freeSpot(
  wanted: { x: number; y: number },
  placed: WorkflowNode[],
  direction: 'lr' | 'tb',
): { x: number; y: number } {
  const spot = { ...wanted }
  for (let attempt = 0; attempt < 50 && overlaps(spot, placed); attempt += 1) {
    if (direction === 'lr') spot.y += STEP_Y * 0.75
    else spot.x += STEP_X * 0.75
  }
  return spot
}

/**
 * Give freshly added nodes (unknown to the previous document and left at the
 * origin by the model) a sensible spot: beside the node they hang off, or
 * below the whole diagram when they are unconnected.
 */
export function placeNewNodes(next: FlowGraph, previous: FlowGraph | undefined): FlowGraph {
  const known = new Set((previous?.nodes ?? []).map((node) => node.id))
  const direction = next.settings?.direction ?? previous?.settings?.direction ?? 'lr'
  const nodes = next.nodes.map((node) => ({ ...node, position: { ...node.position } }))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const placed = nodes.filter(
    (node) => known.has(node.id) || node.position.x !== 0 || node.position.y !== 0,
  )
  const pending = nodes.filter((node) => !placed.includes(node) && node.data.nodeType !== 'frame')
  if (pending.length === 0) return next

  const bounds = placed.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x),
      maxY: Math.max(acc.maxY, node.position.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  )
  let orphanRow = 0

  // Several passes so a chain of new nodes (A -> B -> C, all new) resolves in order.
  const remaining = new Set(pending)
  for (let pass = 0; pass < pending.length + 1 && remaining.size > 0; pass += 1) {
    let progressed = false
    for (const node of [...remaining]) {
      const isSettled = (id: string) => {
        const other = byId.get(id)
        return other !== undefined && !remaining.has(other)
      }
      const incoming = next.edges.find(
        (edge) => edge.target === node.id && edge.source !== node.id && isSettled(edge.source),
      )
      const outgoing = next.edges.find(
        (edge) => edge.source === node.id && edge.target !== node.id && isSettled(edge.target),
      )
      const anchor = incoming ? byId.get(incoming.source) : outgoing ? byId.get(outgoing.target) : undefined
      if (!anchor) continue
      const sign = incoming ? 1 : -1
      const wanted =
        direction === 'lr'
          ? { x: anchor.position.x + sign * STEP_X, y: anchor.position.y }
          : { x: anchor.position.x, y: anchor.position.y + sign * STEP_Y }
      node.position = freeSpot(wanted, placed, direction)
      placed.push(node)
      remaining.delete(node)
      progressed = true
    }
    if (!progressed) break
  }

  // Whatever is left has no link to a placed node: line it up under the diagram.
  const baseX = Number.isFinite(bounds.minX) ? bounds.minX : 0
  const baseY = Number.isFinite(bounds.maxY) ? bounds.maxY + STEP_Y : 0
  for (const node of remaining) {
    node.position = freeSpot({ x: baseX + orphanRow * STEP_X, y: baseY }, placed, 'tb')
    placed.push(node)
    orphanRow += 1
  }
  return { ...next, nodes }
}

/**
 * Parse the model's answer to a modification request into a validated doc,
 * placing any new nodes relative to `current`.
 */
export function parseModifiedText(
  text: string,
  current: WorkflowDoc,
): { ok: true; doc: WorkflowDoc } | { ok: false; error: string } {
  // An all-origin flow (model rewrote everything) still gets auto-layout via
  // the shared generation parser; a partially positioned one is placed here.
  const parsed = parseGeneratedText(text)
  if (!parsed.ok) return parsed
  const flows = Object.fromEntries(
    Object.entries(parsed.doc.flows).map(([id, graph]) => [id, placeNewNodes(graph, current.flows[id])]),
  )
  return { ok: true, doc: normalizeCatalogDefinitionIds(finalizeImportedDoc({ ...parsed.doc, flows })) }
}
