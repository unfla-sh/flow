import dagre from '@dagrejs/dagre'

import {
  type FlowDirection,
  type WorkflowDoc,
  type WorkflowEdge,
  type WorkflowNode,
} from '@/types/workflow'

/** Best-effort node size for layout, preferring measured dimensions. */
export function nodeLayoutSize(node: WorkflowNode): { width: number; height: number } {
  if (node.measured?.width && node.measured?.height) {
    return { width: node.measured.width, height: node.measured.height }
  }
  if (node.width && node.height) return { width: node.width, height: node.height }
  if (node.data.nodeType === 'decision') return { width: 224, height: 144 }
  if (node.data.nodeType === 'condition') return { width: 176, height: 76 }
  if (node.data.nodeType === 'switch') return { width: 208, height: 150 }
  if (node.data.nodeType === 'start' || node.data.nodeType === 'end') {
    return { width: 120, height: 48 }
  }
  if (node.data.nodeType === 'frame') return { width: 280, height: 180 }
  if (node.data.nodeType === 'note') return { width: 180, height: 120 }
  return { width: 208, height: 110 }
}

/**
 * Dagre layout for one flow. Returns top-left positions keyed by node id.
 * `frame` nodes are skipped — they are background boxes, not graph members.
 */
export function computeLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: FlowDirection,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const laidOut = nodes.filter((n) => n.data.nodeType !== 'frame')
  if (laidOut.length === 0) return positions

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction === 'tb' ? 'TB' : 'LR',
    nodesep: 80,
    ranksep: 120,
  })

  const ids = new Set(laidOut.map((n) => n.id))
  for (const node of laidOut) graph.setNode(node.id, nodeLayoutSize(node))
  for (const edge of edges) {
    if (ids.has(edge.source) && ids.has(edge.target)) graph.setEdge(edge.source, edge.target)
  }
  dagre.layout(graph)

  for (const node of laidOut) {
    const laid = graph.node(node.id) as { x: number; y: number } | undefined
    if (!laid) continue
    const size = nodeLayoutSize(node)
    positions.set(node.id, { x: laid.x - size.width / 2, y: laid.y - size.height / 2 })
  }
  return positions
}

/** True when a node carries no meaningful position (importers leave them at origin). */
function needsLayout(nodes: WorkflowNode[]): boolean {
  return nodes.every((n) => !n.position || (n.position.x === 0 && n.position.y === 0))
}

/**
 * Assign dagre positions to any flow whose nodes are all at the origin, so
 * imported / generated docs open already arranged. Flows that already carry
 * real positions are left untouched.
 */
export function finalizeImportedDoc(doc: WorkflowDoc): WorkflowDoc {
  const flows = Object.fromEntries(
    Object.entries(doc.flows).map(([id, graph]) => {
      if (graph.nodes.length === 0 || !needsLayout(graph.nodes)) return [id, graph]
      const positions = computeLayout(graph.nodes, graph.edges, graph.settings?.direction ?? 'lr')
      const nodes = graph.nodes.map((node) =>
        positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node,
      )
      return [id, { ...graph, nodes }]
    }),
  )
  return { ...doc, flows }
}
