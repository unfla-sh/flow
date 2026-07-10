import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { temporal, type TemporalState } from 'zundo'
import { create, useStore } from 'zustand'
import { useMemo } from 'react'

import { computeLayout, nodeLayoutSize } from '@/lib/autoLayout'
import { evaluateExpression } from '@/lib/expression'
import { diagramKindOf, edgeDefaultsForKit } from '@/data/diagramKits'
import { getCatalogEntry, nodeCatalog, normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import { agentLoop } from '@/data/templates/showcase'
import {
  ROOT_FLOW_ID,
  SWITCH_DEFAULT_HANDLE,
  TARGET_HANDLE_ID,
  type ClipboardPayload,
  type FlowDirection,
  type FlowGraph,
  type FlowSettings,
  type SwitchCase,
  type WorkflowDoc,
  type WorkflowEdge,
  type WorkflowEdgeData,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowSettings,
} from '@/types/workflow'

/**
 * Where a connection drag started when it was dropped on empty canvas —
 * lets addNode create the node and wire the edge in one commit.
 */
export interface PendingConnection {
  nodeId: string
  handleId?: string | null
  handleType?: 'source' | 'target'
}

/**
 * Plain target handles carry TARGET_HANDLE_ID purely for React Flow's hover
 * lookup; stored edges keep the historical `null` so existing documents,
 * the edge inspector's "auto" option, and branch checks stay untouched.
 */
function normalizeHandle(handleId: string | null | undefined): string | null {
  return handleId === TARGET_HANDLE_ID ? null : (handleId ?? null)
}

/** Edge / centre a multi-selection is aligned to. */
export type AlignDirection = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
export type DistributeAxis = 'horizontal' | 'vertical'

export type SimStatus = 'idle' | 'running' | 'paused' | 'done'
export interface SimState {
  status: SimStatus
  step: number
  activeNodeIds: string[]
  doneNodeIds: string[]
  activeEdgeIds: string[]
}
const IDLE_SIM: SimState = {
  status: 'idle',
  step: 0,
  activeNodeIds: [],
  doneNodeIds: [],
  activeEdgeIds: [],
}

export interface WorkflowState {
  doc: WorkflowDoc
  /** Bumped on every structural change; selection-only updates leave it alone. */
  docRevision: number
  /** Changes whenever a different document is loaded — used to reset the canvas viewport. */
  docInstanceId: string
  /** Stack of flow ids, ROOT_FLOW_ID first; last entry is the flow being edited. */
  activeFlowPath: string[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  dirty: boolean
  /** localStorage id when the doc was loaded from / saved to a named workflow. */
  currentWorkflowId: string | null
  clipboard: ClipboardPayload | null
  presentationMode: boolean
  /** Catalog ids of recently added nodes, most-recent first (session only). */
  recentCatalogIds: string[]
  /** Visual step-through simulation of the active flow (ephemeral, not undoable). */
  sim: SimState
  simReset: () => void
  simStep: () => void
  simPlay: () => void
  simPause: () => void
  simStop: () => void

  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: Connection) => void
  addNode: (catalogId: string, position: XYPosition, connectFrom?: PendingConnection) => void
  updateNodeData: (id: string, partial: Partial<WorkflowNodeData>) => void
  /** Merge `partial` into every currently-selected node (bulk icon/style edits). */
  applyToSelectedNodes: (partial: Partial<WorkflowNodeData>) => void
  updateEdge: (
    id: string,
    partial: Partial<Pick<WorkflowEdge, 'label' | 'animated' | 'sourceHandle' | 'targetHandle'>> & {
      data?: Partial<WorkflowEdgeData>
    },
  ) => void
  updateSettings: (partial: Partial<WorkflowSettings>) => void
  updateActiveFlowSettings: (partial: Partial<FlowSettings>) => void
  layoutActiveFlow: () => void
  /** Align the selected nodes (needs ≥2) to a shared edge or centre line. */
  alignSelection: (direction: AlignDirection) => void
  /** Even out spacing between the selected nodes (needs ≥3) along an axis. */
  distributeSelection: (axis: DistributeAxis) => void
  setPresentationMode: (enabled: boolean) => void
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  /** Select every node in the active flow (Ctrl/Cmd+A) — e.g. for bulk styling. */
  selectAllNodes: () => void
  clearSelection: () => void

  copySelection: () => void
  cutSelection: () => void
  paste: (position?: XYPosition) => void
  duplicateSelected: () => void
  deleteSelected: () => void
  deleteEdge: (id: string) => void
  simplifyToTwoWayEdge: (edgeId: string) => void
  /** Toggle a single edge between a one-way (end arrow) and two-way (⇄) arrow. */
  toggleEdgeTwoWay: (edgeId: string) => void
  replaceNodeType: (nodeId: string, catalogId: string) => void
  /** Set a switch node's cases, pruning edges whose case branch was removed. */
  updateSwitchCases: (nodeId: string, cases: SwitchCase[]) => void

  openSubFlow: (nodeId: string) => void
  /** Collapse the selected nodes (≥2) into a new sub-flow node, rerouting crossing edges. */
  groupSelectionIntoSubFlow: () => void
  navigateToPathIndex: (index: number) => void

  newWorkflow: () => void
  loadDoc: (doc: WorkflowDoc, workflowId?: string | null) => void
  markSaved: (workflowId: string) => void
}

/** The document shown on a fresh first load (no saved draft): the Tour 4 demo. */
export function buildInitialDoc(): WorkflowDoc {
  return normalizeCatalogDefinitionIds(structuredClone(agentLoop))
}

export function buildDemoDoc(): WorkflowDoc {
  const nodes: WorkflowNode[] = [
    {
      id: 'demo-start',
      type: 'start',
      position: { x: 0, y: 160 },
      data: { label: 'Start', nodeType: 'start', params: {} },
    },
    {
      id: 'demo-form',
      type: 'form',
      position: { x: 200, y: 100 },
      data: {
        label: 'Raise Request Form',
        description: 'Collects the request details',
        nodeType: 'form',
        params: {},
        formSchema: [
          { id: 'f-title', label: 'Request title', type: 'text', required: true },
          { id: 'f-due', label: 'Due date', type: 'date' },
          {
            id: 'f-status',
            label: 'Project status',
            type: 'select',
            options: ['Draft', 'In review', 'Approved'],
          },
        ],
      },
    },
    {
      id: 'demo-script',
      type: 'script',
      position: { x: 520, y: 120 },
      data: {
        label: 'EOT Calculator',
        description: 'Runs the assessment script',
        nodeType: 'script',
        params: { args: [{ id: 'a-mode', key: 'mode', value: 'full' }] },
        scriptPath: '1.py',
        simulatedOutput: { eotDays: 14, status: 'ok' },
      },
    },
    {
      id: 'demo-end',
      type: 'end',
      position: { x: 800, y: 160 },
      data: { label: 'End', nodeType: 'end', params: {} },
    },
  ]
  const edges: WorkflowEdge[] = [
    { id: 'demo-e1', source: 'demo-start', target: 'demo-form' },
    { id: 'demo-e2', source: 'demo-form', target: 'demo-script', label: 'submitted' },
    { id: 'demo-e3', source: 'demo-script', target: 'demo-end' },
  ]
  return {
    schemaVersion: 1,
    settings: { name: 'Main Workflow', version: '0.1.0', description: '' },
    flows: { [ROOT_FLOW_ID]: { nodes, edges, settings: { direction: 'lr' } } },
  }
}

export function emptyDoc(name = 'Untitled Workflow'): WorkflowDoc {
  return {
    schemaVersion: 1,
    settings: { name, version: '0.1.0', description: '' },
    flows: { [ROOT_FLOW_ID]: { nodes: [], edges: [], settings: { direction: 'lr' } } },
  }
}

const activeFlowId = (state: WorkflowState) =>
  state.activeFlowPath[state.activeFlowPath.length - 1]

/** Replace one flow's graph inside the doc, bumping revision + dirty. */
function commitFlow(
  state: WorkflowState,
  flowId: string,
  fn: (graph: FlowGraph) => FlowGraph,
): Partial<WorkflowState> {
  const graph = state.doc.flows[flowId]
  if (!graph) return {}
  return {
    doc: { ...state.doc, flows: { ...state.doc.flows, [flowId]: fn(graph) } },
    docRevision: state.docRevision + 1,
    dirty: true,
  }
}

function selectedNodes(state: WorkflowState): WorkflowNode[] {
  const graph = state.doc.flows[activeFlowId(state)]
  if (!graph) return []
  return graph.nodes.filter((n) => n.selected || n.id === state.selectedNodeId)
}

/** Build a simulation context by merging the object-shaped simulatedOutputs of nodes. */
function simContext(graph: FlowGraph, ids: string[]): Record<string, unknown> {
  const ctx: Record<string, unknown> = {}
  for (const id of ids) {
    const out = graph.nodes.find((n) => n.id === id)?.data.simulatedOutput
    if (out && typeof out === 'object' && !Array.isArray(out)) {
      Object.assign(ctx, out as Record<string, unknown>)
    }
  }
  return ctx
}

/**
 * Pick which outgoing edges a branch node takes during simulation by safely
 * evaluating its expression against the accumulated context. Falls back to all
 * outgoing edges when the expression can't be resolved.
 */
function branchOutEdges(
  node: WorkflowNode,
  outs: WorkflowEdge[],
  ctx: Record<string, unknown>,
): WorkflowEdge[] {
  const type = node.data.nodeType
  const expr = node.data.params.expression as string | undefined
  if ((type !== 'condition' && type !== 'decision' && type !== 'switch') || !expr) return outs
  try {
    if (type === 'switch') {
      const value = evaluateExpression(expr, ctx)
      for (const c of node.data.cases ?? []) {
        let caseVal: unknown
        try {
          caseVal = evaluateExpression(c.when, ctx)
        } catch {
          caseVal = c.when
        }
        if (caseVal === value || String(caseVal) === String(value)) {
          const chosen = outs.filter((e) => e.sourceHandle === c.id)
          if (chosen.length) return chosen
        }
      }
      const def = outs.filter((e) => e.sourceHandle === SWITCH_DEFAULT_HANDLE)
      return def.length ? def : outs
    }
    const handle = evaluateExpression(expr, ctx) ? 'true' : 'false'
    const chosen = outs.filter((e) => e.sourceHandle === handle)
    return chosen.length ? chosen : outs
  } catch {
    return outs
  }
}

function flowDirection(graph: FlowGraph | undefined): FlowDirection {
  return graph?.settings?.direction ?? 'lr'
}

interface NodeRect {
  x: number
  y: number
  width: number
  height: number
}

function nodeRect(node: WorkflowNode): NodeRect {
  const { width, height } = nodeLayoutSize(node)
  return { x: node.position.x, y: node.position.y, width, height }
}

/** Apply moved positions to the active flow as one undoable, dirty-marking edit. */
function applyPositions(
  state: WorkflowState,
  moved: Map<string, { x: number; y: number }>,
): Partial<WorkflowState> {
  if (moved.size === 0) return {}
  return commitFlow(state, activeFlowId(state), (graph) => ({
    ...graph,
    nodes: graph.nodes.map((node) =>
      moved.has(node.id) ? { ...node, position: moved.get(node.id)! } : node,
    ),
  }))
}

/** Recursively collect the inner flows referenced by sub-flow nodes. */
function collectInnerFlows(
  nodes: WorkflowNode[],
  allFlows: Record<string, FlowGraph>,
  out: Record<string, FlowGraph>,
): void {
  for (const node of nodes) {
    const flowId = node.data.subFlowId
    if (flowId && allFlows[flowId] && !out[flowId]) {
      out[flowId] = allFlows[flowId]
      collectInnerFlows(allFlows[flowId].nodes, allFlows, out)
    }
  }
}

/** Deep-clone a clipboard payload with fresh ids for nodes, edges and flows. */
function remapPayload(payload: ClipboardPayload): {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  flows: Record<string, FlowGraph>
} {
  const cloned = structuredClone(payload)
  const flowIdMap = new Map<string, string>()
  for (const oldId of Object.keys(cloned.flows)) flowIdMap.set(oldId, crypto.randomUUID())

  const remapGraph = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    const nodeIdMap = new Map<string, string>()
    for (const node of nodes) nodeIdMap.set(node.id, crypto.randomUUID())
    const newNodes = nodes.map((node) => ({
      ...node,
      id: nodeIdMap.get(node.id)!,
      data: {
        ...node.data,
        subFlowId: node.data.subFlowId
          ? (flowIdMap.get(node.data.subFlowId) ?? undefined)
          : undefined,
      },
    }))
    const newEdges = edges
      .filter((e) => nodeIdMap.has(e.source) && nodeIdMap.has(e.target))
      .map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: nodeIdMap.get(e.source)!,
        target: nodeIdMap.get(e.target)!,
      }))
    return { nodes: newNodes, edges: newEdges }
  }

  const flows: Record<string, FlowGraph> = {}
  for (const [oldId, graph] of Object.entries(cloned.flows)) {
    flows[flowIdMap.get(oldId)!] = remapGraph(graph.nodes, graph.edges)
  }
  const top = remapGraph(cloned.nodes, cloned.edges)
  return { ...top, flows }
}

/** Flow ids that become unreachable when the given nodes are removed. */
function flowsToDelete(
  removed: WorkflowNode[],
  allFlows: Record<string, FlowGraph>,
): Set<string> {
  const doomed = new Set<string>()
  const visit = (nodes: WorkflowNode[]) => {
    for (const node of nodes) {
      const flowId = node.data.subFlowId
      if (flowId && allFlows[flowId] && !doomed.has(flowId)) {
        doomed.add(flowId)
        visit(allFlows[flowId].nodes)
      }
    }
  }
  visit(removed)
  return doomed
}

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set, get) => ({
      doc: buildInitialDoc(),
      docRevision: 0,
      docInstanceId: crypto.randomUUID(),
      activeFlowPath: [ROOT_FLOW_ID],
      selectedNodeId: null,
      selectedEdgeId: null,
      dirty: false,
      currentWorkflowId: null,
      clipboard: null,
      presentationMode: false,
      recentCatalogIds: [],
      sim: IDLE_SIM,

      onNodesChange: (changes) => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph) return {}
          const structural = changes.some(
            (c) => c.type !== 'select' && c.type !== 'dimensions',
          )
          const nodes = applyNodeChanges(changes, graph.nodes)
          return {
            doc: { ...state.doc, flows: { ...state.doc.flows, [flowId]: { ...graph, nodes } } },
            ...(structural ? { docRevision: state.docRevision + 1, dirty: true } : {}),
          }
        })
      },

      onEdgesChange: (changes) => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph) return {}
          const structural = changes.some((c) => c.type !== 'select')
          const edges = applyEdgeChanges(changes, graph.edges)
          return {
            doc: { ...state.doc, flows: { ...state.doc.flows, [flowId]: { ...graph, edges } } },
            ...(structural ? { docRevision: state.docRevision + 1, dirty: true } : {}),
          }
        })
      },

      onConnect: (connection) => {
        // A link drawn between two mid-of-side handles (top/bottom/left/right)
        // is usually a peer relationship (e.g. web ⇄ db), so default it to a
        // two-way arrow. Head/tail flow connections stay one-way.
        const MID = new Set(['top', 'bottom', 'left', 'right'])
        const twoWay =
          MID.has(connection.sourceHandle ?? '') && MID.has(connection.targetHandle ?? '')
        set((state) => {
          const diagramKind = diagramKindOf(state.doc.settings)
          const defaults = edgeDefaultsForKit(diagramKind)
          const peerTwoWay = twoWay && (diagramKind === 'workflow' || diagramKind === 'general')
          return commitFlow(state, activeFlowId(state), (graph) => ({
            ...graph,
            edges: addEdge(
              {
                ...connection,
                // The plain target handle carries an id only for React Flow's
                // hover lookup; stored edges keep the historical null form.
                sourceHandle: normalizeHandle(connection.sourceHandle),
                targetHandle: normalizeHandle(connection.targetHandle),
                id: crypto.randomUUID(),
                type: 'workflow',
                data: {
                  ...defaults,
                  style: { ...defaults.style, ...(peerTwoWay ? { arrowStart: true } : {}) },
                },
              },
              graph.edges,
            ),
          }))
        })
      },

      addNode: (catalogId, position, connectFrom) => {
        const entry = getCatalogEntry(catalogId)
        if (!entry) return
        const id = crypto.randomUUID()
        const data: WorkflowNodeData = { ...entry.defaultData(), definitionId: entry.id }
        // Annotation-only nodes have no handles, so a pending connection
        // cannot attach to them — add the node but skip the edge.
        const canConnect =
          connectFrom !== undefined && entry.nodeType !== 'note' && entry.nodeType !== 'frame'
        const backwards = connectFrom?.handleType === 'target'
        const fromHandle = normalizeHandle(connectFrom?.handleId)
        const edgeDefaults = edgeDefaultsForKit(diagramKindOf(get().doc.settings))
        const newEdge: WorkflowEdge | null = canConnect
          ? {
              id: crypto.randomUUID(),
              type: 'workflow',
              source: backwards ? id : connectFrom.nodeId,
              target: backwards ? connectFrom.nodeId : id,
              ...(!backwards && fromHandle ? { sourceHandle: fromHandle } : {}),
              ...(backwards && fromHandle ? { targetHandle: fromHandle } : {}),
              data: edgeDefaults,
            }
          : null
        set((state) => {
          let doc = state.doc
          // Sub-flow nodes get their inner flow immediately so Open always works.
          if (entry.nodeType === 'subflow') {
            const flowId = crypto.randomUUID()
            data.subFlowId = flowId
            doc = {
              ...doc,
              flows: {
                ...doc.flows,
                [flowId]: { nodes: [], edges: [], settings: { direction: 'lr' } },
              },
            }
          }
          const flowId = activeFlowId(state)
          const graph = doc.flows[flowId]
          if (!graph) return {}
          const node: WorkflowNode = { id, type: entry.nodeType, position, data }
          // Annotation nodes need an explicit size — they have no intrinsic
          // content height. Frames sit behind everything; give a roomy default
          // so the dashed box and its resize handles are easy to grab.
          if (entry.nodeType === 'frame') {
            node.width = 360
            node.height = 240
            node.zIndex = -1
          } else if (entry.nodeType === 'note') {
            node.width = 240
            node.height = 160
          }
          // Select the new node (and deselect the rest) so it's immediately
          // configurable and resizable nodes show their handles right away.
          node.selected = true
          return {
            doc: {
              ...doc,
              flows: {
                ...doc.flows,
                [flowId]: {
                  ...graph,
                  nodes: [
                    ...graph.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
                    node,
                  ],
                  ...(newEdge ? { edges: [...graph.edges, newEdge] } : {}),
                },
              },
            },
            docRevision: state.docRevision + 1,
            dirty: true,
            selectedNodeId: id,
            selectedEdgeId: null,
            recentCatalogIds: [
              catalogId,
              ...state.recentCatalogIds.filter((c) => c !== catalogId),
            ].slice(0, 6),
          }
        })
      },

      updateNodeData: (id, partial) => {
        set((state) =>
          commitFlow(state, activeFlowId(state), (graph) => ({
            ...graph,
            nodes: graph.nodes.map((node) =>
              node.id === id ? { ...node, data: { ...node.data, ...partial } } : node,
            ),
          })),
        )
      },

      applyToSelectedNodes: (partial) => {
        set((state) => {
          const ids = new Set(selectedNodes(state).map((n) => n.id))
          if (ids.size === 0) return state
          return commitFlow(state, activeFlowId(state), (graph) => ({
            ...graph,
            nodes: graph.nodes.map((node) =>
              ids.has(node.id)
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      ...partial,
                      // Style is merged (not replaced) so an iconBg edit keeps other style fields.
                      ...(partial.style
                        ? { style: { ...node.data.style, ...partial.style } }
                        : {}),
                    },
                  }
                : node,
            ),
          }))
        })
      },

      updateEdge: (id, partial) => {
        set((state) =>
          commitFlow(state, activeFlowId(state), (graph) => ({
            ...graph,
            edges: graph.edges.map((edge) =>
              edge.id === id
                ? {
                    ...edge,
                    ...('label' in partial ? { label: partial.label } : {}),
                    ...('animated' in partial ? { animated: partial.animated } : {}),
                    ...('sourceHandle' in partial ? { sourceHandle: partial.sourceHandle } : {}),
                    ...('targetHandle' in partial ? { targetHandle: partial.targetHandle } : {}),
                    data: { ...edge.data, ...partial.data },
                  }
                : edge,
            ),
          })),
        )
      },

      updateSettings: (partial) => {
        set((state) => ({
          doc: { ...state.doc, settings: { ...state.doc.settings, ...partial } },
          docRevision: state.docRevision + 1,
          dirty: true,
        }))
      },

      updateActiveFlowSettings: (partial) => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph) return {}
          return {
            doc: {
              ...state.doc,
              flows: {
                ...state.doc.flows,
                [flowId]: { ...graph, settings: { ...graph.settings, ...partial } },
              },
            },
            docRevision: state.docRevision + 1,
            dirty: true,
          }
        })
      },

      layoutActiveFlow: () => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph || graph.nodes.length === 0) return {}

          const positions = computeLayout(graph.nodes, graph.edges, flowDirection(graph))
          const nodes = graph.nodes.map((node) =>
            positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node,
          )

          return {
            doc: {
              ...state.doc,
              flows: { ...state.doc.flows, [flowId]: { ...graph, nodes } },
            },
            docRevision: state.docRevision + 1,
            dirty: true,
          }
        })
      },

      alignSelection: (direction) => {
        const state = get()
        const sel = selectedNodes(state)
        if (sel.length < 2) return
        const rects = sel.map(nodeRect)
        const minX = Math.min(...rects.map((r) => r.x))
        const maxRight = Math.max(...rects.map((r) => r.x + r.width))
        const minY = Math.min(...rects.map((r) => r.y))
        const maxBottom = Math.max(...rects.map((r) => r.y + r.height))
        const centerX = (minX + maxRight) / 2
        const centerY = (minY + maxBottom) / 2

        const moved = new Map<string, { x: number; y: number }>()
        sel.forEach((node, i) => {
          const r = rects[i]
          let { x, y } = node.position
          switch (direction) {
            case 'left':
              x = minX
              break
            case 'right':
              x = maxRight - r.width
              break
            case 'center-h':
              x = centerX - r.width / 2
              break
            case 'top':
              y = minY
              break
            case 'bottom':
              y = maxBottom - r.height
              break
            case 'center-v':
              y = centerY - r.height / 2
              break
          }
          if (x !== node.position.x || y !== node.position.y) moved.set(node.id, { x, y })
        })
        set((current) => applyPositions(current, moved))
      },

      distributeSelection: (axis) => {
        const state = get()
        const sel = selectedNodes(state)
        if (sel.length < 3) return
        const items = sel
          .map((node) => ({ node, rect: nodeRect(node) }))
          .sort((a, b) =>
            axis === 'horizontal' ? a.rect.x - b.rect.x : a.rect.y - b.rect.y,
          )

        const first = items[0].rect
        const last = items[items.length - 1].rect
        const span =
          axis === 'horizontal'
            ? last.x + last.width - first.x
            : last.y + last.height - first.y
        const totalSize = items.reduce(
          (sum, it) => sum + (axis === 'horizontal' ? it.rect.width : it.rect.height),
          0,
        )
        const gap = (span - totalSize) / (items.length - 1)

        const moved = new Map<string, { x: number; y: number }>()
        let cursor = axis === 'horizontal' ? first.x : first.y
        for (const { node, rect } of items) {
          if (axis === 'horizontal') {
            if (cursor !== node.position.x) moved.set(node.id, { x: cursor, y: node.position.y })
            cursor += rect.width + gap
          } else {
            if (cursor !== node.position.y) moved.set(node.id, { x: node.position.x, y: cursor })
            cursor += rect.height + gap
          }
        }
        set((current) => applyPositions(current, moved))
      },

      setPresentationMode: (enabled) => {
        set({ presentationMode: enabled, selectedNodeId: null, selectedEdgeId: null })
      },

      simReset: () => {
        const state = get()
        const graph = state.doc.flows[activeFlowId(state)]
        if (!graph) return
        const targets = new Set(graph.edges.map((e) => e.target))
        const starts = graph.nodes.filter(
          (n) => n.data.nodeType === 'start' || !targets.has(n.id),
        )
        const entry = starts.length > 0 ? starts : graph.nodes.slice(0, 1)
        set({
          sim: { ...IDLE_SIM, status: 'paused', activeNodeIds: entry.map((n) => n.id) },
        })
      },

      simStep: () => {
        const state = get()
        const graph = state.doc.flows[activeFlowId(state)]
        if (!graph) return
        const sim = state.sim.status === 'idle' ? null : state.sim
        if (!sim || sim.activeNodeIds.length === 0) {
          set({ sim: { ...state.sim, status: 'done', activeEdgeIds: [] } })
          return
        }
        const done = Array.from(new Set([...sim.doneNodeIds, ...sim.activeNodeIds]))
        // Branch-aware: at condition/switch/decision nodes follow only the
        // branch whose expression matches (sandbox-evaluated against outputs
        // produced so far); otherwise follow all outgoing edges.
        const ctx = simContext(graph, done)
        const outEdges: WorkflowEdge[] = []
        for (const nodeId of sim.activeNodeIds) {
          const node = graph.nodes.find((n) => n.id === nodeId)
          const outs = graph.edges.filter((e) => e.source === nodeId)
          outEdges.push(...(node ? branchOutEdges(node, outs, ctx) : outs))
        }
        const next = Array.from(
          new Set(outEdges.map((e) => e.target).filter((t) => !done.includes(t))),
        )
        set({
          sim: {
            status: next.length === 0 ? 'done' : sim.status === 'running' ? 'running' : 'paused',
            step: sim.step + 1,
            doneNodeIds: done,
            activeNodeIds: next,
            activeEdgeIds: outEdges.map((e) => e.id),
          },
        })
      },

      simPlay: () => {
        const { sim } = get()
        if (sim.status === 'idle' || sim.status === 'done') get().simReset()
        set((s) => ({ sim: { ...s.sim, status: 'running' } }))
      },

      simPause: () => set((s) => ({ sim: { ...s.sim, status: 'paused' } })),
      simStop: () => set({ sim: IDLE_SIM }),

      setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
      selectAllNodes: () => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph || graph.nodes.length === 0) return {}
          const nodes = graph.nodes.map((n) => (n.selected ? n : { ...n, selected: true }))
          // Selection isn't a document edit, so leave docRevision/dirty untouched.
          return {
            doc: { ...state.doc, flows: { ...state.doc.flows, [flowId]: { ...graph, nodes } } },
            selectedNodeId: nodes[0].id,
            selectedEdgeId: null,
          }
        })
      },
      clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

      copySelection: () => {
        const state = get()
        const nodes = selectedNodes(state)
        if (nodes.length === 0) return
        const graph = state.doc.flows[activeFlowId(state)]
        const ids = new Set(nodes.map((n) => n.id))
        const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
        const flows: Record<string, FlowGraph> = {}
        collectInnerFlows(nodes, state.doc.flows, flows)
        set({ clipboard: structuredClone({ nodes, edges, flows }) })
      },

      cutSelection: () => {
        get().copySelection()
        get().deleteSelected()
      },

      paste: (position) => {
        const state = get()
        if (!state.clipboard) return
        const { nodes, edges, flows } = remapPayload(state.clipboard)
        if (nodes.length === 0) return

        let dx = 32
        let dy = 32
        if (position) {
          const minX = Math.min(...nodes.map((n) => n.position.x))
          const minY = Math.min(...nodes.map((n) => n.position.y))
          dx = position.x - minX
          dy = position.y - minY
        }
        const placed = nodes.map((n) => ({
          ...n,
          position: { x: n.position.x + dx, y: n.position.y + dy },
          selected: true,
        }))

        set((current) => {
          const flowId = activeFlowId(current)
          const graph = current.doc.flows[flowId]
          if (!graph) return {}
          return {
            doc: {
              ...current.doc,
              flows: {
                ...current.doc.flows,
                ...flows,
                [flowId]: {
                  ...graph,
                  nodes: [...graph.nodes.map((n) => ({ ...n, selected: false })), ...placed],
                  edges: [...graph.edges, ...edges],
                },
              },
            },
            docRevision: current.docRevision + 1,
            dirty: true,
            selectedNodeId: placed[0].id,
            selectedEdgeId: null,
          }
        })
      },

      duplicateSelected: () => {
        const state = get()
        const before = state.clipboard
        state.copySelection()
        get().paste()
        set({ clipboard: before })
      },

      deleteSelected: () => {
        const state = get()
        const nodes = selectedNodes(state)
        if (nodes.length > 0) {
          const ids = new Set(nodes.map((n) => n.id))
          const doomedFlows = flowsToDelete(nodes, state.doc.flows)
          set((current) => {
            const flowId = activeFlowId(current)
            const graph = current.doc.flows[flowId]
            if (!graph) return {}
            const flows = { ...current.doc.flows }
            for (const id of doomedFlows) delete flows[id]
            flows[flowId] = {
              ...graph,
              nodes: graph.nodes.filter((n) => !ids.has(n.id)),
              edges: graph.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
            }
            return {
              doc: { ...current.doc, flows },
              docRevision: current.docRevision + 1,
              dirty: true,
              selectedNodeId: null,
            }
          })
        } else if (state.selectedEdgeId) {
          get().deleteEdge(state.selectedEdgeId)
        }
      },

      deleteEdge: (id) => {
        set((state) => ({
          ...commitFlow(state, activeFlowId(state), (graph) => ({
            ...graph,
            edges: graph.edges.filter((edge) => edge.id !== id),
          })),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }))
      },

      simplifyToTwoWayEdge: (edgeId) => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          if (!graph) return {}
          const edge = graph.edges.find((candidate) => candidate.id === edgeId)
          if (!edge) return {}
          const source = graph.nodes.find((node) => node.id === edge.source)
          const target = graph.nodes.find((node) => node.id === edge.target)
          if (!source || !target || source.id === target.id) return {}

          const relatedEdges = graph.edges.filter(
            (candidate) =>
              (candidate.source === source.id && candidate.target === target.id) ||
              (candidate.source === target.id && candidate.target === source.id),
          )
          const labels = [
            ...new Set(
              relatedEdges
                .map((candidate) => candidate.label)
                .filter(
                  (label): label is string => typeof label === 'string' && label.trim().length > 0,
                )
                .map((label) => label.trim()),
            ),
          ]
          const bridgeLabel =
            labels.length > 1
              ? labels.join(' / ')
              : labels[0] || (typeof edge.label === 'string' ? edge.label : undefined)
          const reverse = relatedEdges.find(
            (candidate) => candidate.source === target.id && candidate.target === source.id,
          )
          const style = {
            ...(reverse?.data?.style ?? {}),
            ...(edge.data?.style ?? {}),
          }
          const twoWayStyle = {
            ...(style.stroke ? { stroke: style.stroke } : {}),
            ...(style.lineWidth ? { lineWidth: style.lineWidth } : {}),
            ...(style.arrowSize ? { arrowSize: style.arrowSize } : {}),
            arrow: true,
            arrowStart: true,
            bidirectional: false,
          }
          const twoWayEdge: WorkflowEdge = {
            ...edge,
            id: edge.id,
            type: 'workflow',
            source: edge.source,
            target: edge.target,
            ...(bridgeLabel ? { label: bridgeLabel } : {}),
            animated: edge.animated || reverse?.animated || undefined,
            data: {
              ...edge.data,
              style: twoWayStyle,
            },
          }

          return {
            doc: {
              ...state.doc,
              flows: {
                ...state.doc.flows,
                [flowId]: {
                  ...graph,
                  nodes: graph.nodes.map((node) => ({ ...node, selected: false })),
                  edges: [
                    ...graph.edges.filter(
                      (candidate) => !relatedEdges.some((related) => related.id === candidate.id),
                    ),
                    twoWayEdge,
                  ],
                },
              },
            },
            docRevision: state.docRevision + 1,
            dirty: true,
            selectedNodeId: null,
            selectedEdgeId: twoWayEdge.id,
          }
        })
      },

      toggleEdgeTwoWay: (edgeId) => {
        const state = get()
        const graph = state.doc.flows[activeFlowId(state)]
        const edge = graph?.edges.find((e) => e.id === edgeId)
        if (!edge) return
        const style = edge.data?.style ?? {}
        const isTwoWay = style.arrow === true && style.arrowStart === true
        get().updateEdge(edgeId, {
          data: {
            style: { ...style, bidirectional: false, arrow: true, arrowStart: !isTwoWay },
          },
        })
      },

      replaceNodeType: (nodeId, catalogId) => {
        const entry = getCatalogEntry(catalogId)
        if (!entry) return
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          const node = graph?.nodes.find((n) => n.id === nodeId)
          if (!graph || !node) return {}
          const wasSubflow = node.data.nodeType === 'subflow'
          const freshData: WorkflowNodeData = {
            ...entry.defaultData(),
            definitionId: entry.id,
          }
          let doc = state.doc
          if (entry.nodeType === 'subflow') {
            const newFlowId = node.data.subFlowId ?? crypto.randomUUID()
            freshData.subFlowId = newFlowId
            if (!doc.flows[newFlowId]) {
              doc = {
                ...doc,
                flows: {
                  ...doc.flows,
                  [newFlowId]: { nodes: [], edges: [], settings: { direction: 'lr' } },
                },
              }
            }
          }
          const data: WorkflowNodeData = {
            ...freshData,
            label: node.data.label,
            description: node.data.description,
          }
          const flows = { ...doc.flows }
          if (wasSubflow && entry.nodeType !== 'subflow' && node.data.subFlowId) {
            for (const id of flowsToDelete([node], doc.flows)) delete flows[id]
          }
          const newNode: WorkflowNode = { ...node, type: entry.nodeType, data }
          let edges = graph.edges
          if (node.data.nodeType !== entry.nodeType) {
            // Re-home outgoing edges onto the new type's first source handle.
            const newSourceHandle =
              entry.nodeType === 'condition' || entry.nodeType === 'decision'
                ? 'true'
                : entry.nodeType === 'switch'
                  ? (data.cases?.[0]?.id ?? SWITCH_DEFAULT_HANDLE)
                  : null
            edges = edges.map((e) =>
              e.source === nodeId ? { ...e, sourceHandle: newSourceHandle } : e,
            )
          }
          if (entry.nodeType === 'start') edges = edges.filter((e) => e.target !== nodeId)
          if (entry.nodeType === 'end') edges = edges.filter((e) => e.source !== nodeId)
          flows[flowId] = {
            ...graph,
            nodes: graph.nodes.map((n) => (n.id === nodeId ? newNode : n)),
            edges,
          }
          return {
            doc: { ...doc, flows },
            docRevision: state.docRevision + 1,
            dirty: true,
          }
        })
      },

      updateSwitchCases: (nodeId, cases) => {
        set((state) =>
          commitFlow(state, activeFlowId(state), (graph) => {
            const valid = new Set([...cases.map((c) => c.id), SWITCH_DEFAULT_HANDLE])
            return {
              ...graph,
              nodes: graph.nodes.map((node) =>
                node.id === nodeId ? { ...node, data: { ...node.data, cases } } : node,
              ),
              edges: graph.edges.filter(
                (edge) =>
                  edge.source !== nodeId || valid.has(edge.sourceHandle ?? SWITCH_DEFAULT_HANDLE),
              ),
            }
          }),
        )
      },

      openSubFlow: (nodeId) => {
        set((state) => {
          const flowId = activeFlowId(state)
          const graph = state.doc.flows[flowId]
          const node = graph?.nodes.find((n) => n.id === nodeId)
          if (!graph || !node || node.data.nodeType !== 'subflow') return {}
          let doc = state.doc
          let innerId = node.data.subFlowId
          let revisionBump = 0
          if (!innerId || !doc.flows[innerId]) {
            innerId = innerId ?? crypto.randomUUID()
            doc = {
              ...doc,
              flows: {
                ...doc.flows,
                [innerId]: doc.flows[innerId] ?? {
                  nodes: [],
                  edges: [],
                  settings: { direction: 'lr' },
                },
                [flowId]: {
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, subFlowId: innerId } } : n,
                  ),
                },
              },
            }
            revisionBump = 1
          }
          return {
            doc,
            docRevision: state.docRevision + revisionBump,
            ...(revisionBump ? { dirty: true } : {}),
            activeFlowPath: [...state.activeFlowPath, innerId],
            selectedNodeId: null,
            selectedEdgeId: null,
          }
        })
      },

      groupSelectionIntoSubFlow: () => {
        const state = get()
        const flowId = activeFlowId(state)
        const graph = state.doc.flows[flowId]
        if (!graph) return
        const selectedIds = new Set(selectedNodes(state).map((n) => n.id))
        if (selectedIds.size < 2) return

        const inner = graph.nodes.filter((n) => selectedIds.has(n.id))
        const outer = graph.nodes.filter((n) => !selectedIds.has(n.id))
        const cx = inner.reduce((s, n) => s + n.position.x, 0) / inner.length
        const cy = inner.reduce((s, n) => s + n.position.y, 0) / inner.length

        const internalEdges = graph.edges.filter(
          (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
        )
        const innerFlowId = crypto.randomUUID()
        const subId = crypto.randomUUID()

        // Crossing edges reconnect to the group node; dedupe per direction.
        const seenIn = new Set<string>()
        const seenOut = new Set<string>()
        const reconnected: WorkflowEdge[] = []
        for (const e of graph.edges) {
          const fromSel = selectedIds.has(e.source)
          const toSel = selectedIds.has(e.target)
          if (fromSel && toSel) continue // internal → moves inside
          if (!fromSel && toSel) {
            if (seenIn.has(e.source)) continue
            seenIn.add(e.source)
            reconnected.push({ ...e, target: subId, targetHandle: null })
          } else if (fromSel && !toSel) {
            if (seenOut.has(e.target)) continue
            seenOut.add(e.target)
            reconnected.push({ ...e, source: subId, sourceHandle: null })
          } else {
            reconnected.push(e) // external↔external untouched
          }
        }

        const subNode: WorkflowNode = {
          id: subId,
          type: 'subflow',
          position: { x: cx, y: cy },
          selected: true,
          data: {
            label: 'Group',
            nodeType: 'subflow',
            definitionId: 'subflow',
            params: {},
            subFlowId: innerFlowId,
          },
        }

        set((current) => ({
          doc: {
            ...current.doc,
            flows: {
              ...current.doc.flows,
              [innerFlowId]: {
                nodes: inner.map((n) => ({ ...n, selected: false })),
                edges: internalEdges,
                settings: { direction: graph.settings?.direction ?? 'lr' },
              },
              [flowId]: {
                ...graph,
                nodes: [...outer.map((n) => ({ ...n, selected: false })), subNode],
                edges: reconnected,
              },
            },
          },
          docRevision: current.docRevision + 1,
          dirty: true,
          selectedNodeId: subId,
          selectedEdgeId: null,
        }))
      },

      navigateToPathIndex: (index) => {
        set((state) => {
          if (index < 0 || index >= state.activeFlowPath.length) return {}
          return {
            activeFlowPath: state.activeFlowPath.slice(0, index + 1),
            selectedNodeId: null,
            selectedEdgeId: null,
            sim: IDLE_SIM,
          }
        })
      },

      newWorkflow: () => {
        set({
          doc: emptyDoc(),
          docRevision: get().docRevision + 1,
          docInstanceId: crypto.randomUUID(),
          activeFlowPath: [ROOT_FLOW_ID],
          selectedNodeId: null,
          selectedEdgeId: null,
          dirty: false,
          currentWorkflowId: null,
          presentationMode: false,
          sim: IDLE_SIM,
        })
      },

      loadDoc: (doc, workflowId = null) => {
        set({
          doc: normalizeCatalogDefinitionIds(structuredClone(doc)),
          docRevision: get().docRevision + 1,
          docInstanceId: crypto.randomUUID(),
          activeFlowPath: [ROOT_FLOW_ID],
          selectedNodeId: null,
          selectedEdgeId: null,
          dirty: false,
          currentWorkflowId: workflowId,
          presentationMode: false,
          sim: IDLE_SIM,
        })
      },

      markSaved: (workflowId) => {
        set({ dirty: false, currentWorkflowId: workflowId })
      },
    }),
    {
      partialize: (state) => ({ doc: state.doc, docRevision: state.docRevision }),
      equality: (past, current) => past.docRevision === current.docRevision,
      limit: 100,
      handleSet: (handleSet) => {
        // Leading-edge throttle: a burst of rapid changes (e.g. a node drag)
        // records only the state before the burst, becoming one undo step.
        let cooldown: ReturnType<typeof setTimeout> | null = null
        return (...args: Parameters<typeof handleSet>) => {
          if (cooldown) return
          handleSet(...args)
          cooldown = setTimeout(() => {
            cooldown = null
          }, 300)
        }
      },
    },
  ),
)

type WorkflowTemporal = TemporalState<Pick<WorkflowState, 'doc' | 'docRevision'>>

export function useTemporalStore<T>(selector: (state: WorkflowTemporal) => T): T {
  return useStore(useWorkflowStore.temporal, selector)
}

/** Undo/redo with path + selection cleanup (a restored doc may lack the open flow). */
function afterHistoryRestore() {
  const state = useWorkflowStore.getState()
  let path = state.activeFlowPath
  const firstMissing = path.findIndex((id) => !state.doc.flows[id])
  if (firstMissing === 0) path = [ROOT_FLOW_ID]
  else if (firstMissing > 0) path = path.slice(0, firstMissing)
  useWorkflowStore.setState({
    activeFlowPath: path,
    selectedNodeId: null,
    selectedEdgeId: null,
    dirty: true,
  })
}

export function undo() {
  useWorkflowStore.temporal.getState().undo()
  afterHistoryRestore()
}

export function redo() {
  useWorkflowStore.temporal.getState().redo()
  afterHistoryRestore()
}

export function clearHistory() {
  useWorkflowStore.temporal.getState().clear()
}

export function useActiveFlow(): FlowGraph {
  return useWorkflowStore((state) => {
    const id = state.activeFlowPath[state.activeFlowPath.length - 1]
    return state.doc.flows[id] ?? state.doc.flows[ROOT_FLOW_ID]
  })
}

export function useSelectedNode(): WorkflowNode | undefined {
  return useWorkflowStore((state) => {
    if (!state.selectedNodeId) return undefined
    const graph = state.doc.flows[state.activeFlowPath[state.activeFlowPath.length - 1]]
    return graph?.nodes.find((node) => node.id === state.selectedNodeId)
  })
}

/** How many nodes are currently selected in the active flow (for bulk edits). */
export function useSelectedNodeCount(): number {
  return useWorkflowStore((state) => {
    const graph = state.doc.flows[state.activeFlowPath[state.activeFlowPath.length - 1]]
    if (!graph) return 0
    const marked = graph.nodes.filter((node) => node.selected).length
    // A single click sets selectedNodeId without node.selected; treat that as 1.
    return marked > 0 ? marked : state.selectedNodeId ? 1 : 0
  })
}

export function useSelectedEdge(): WorkflowEdge | undefined {
  return useWorkflowStore((state) => {
    if (!state.selectedEdgeId) return undefined
    const graph = state.doc.flows[state.activeFlowPath[state.activeFlowPath.length - 1]]
    return graph?.edges.find((edge) => edge.id === state.selectedEdgeId)
  })
}

/** Breadcrumb labels for the current path (root uses the workflow name). */
export function useBreadcrumbs(): { flowId: string; label: string }[] {
  const path = useWorkflowStore((state) => state.activeFlowPath)
  const doc = useWorkflowStore((state) => state.doc)
  return useMemo(
    () =>
      path.map((flowId, i) => {
        if (i === 0) return { flowId, label: doc.settings.name }
        const parent = doc.flows[path[i - 1]]
        const owner = parent?.nodes.find((n) => n.data.subFlowId === flowId)
        return { flowId, label: owner?.data.label ?? 'Sub-flow' }
      }),
    [path, doc],
  )
}

/** Inner node/edge counts for a sub-flow node, for badges and inspectors. */
export function getFlowStats(doc: WorkflowDoc, flowId: string | undefined) {
  const graph = flowId ? doc.flows[flowId] : undefined
  return { nodes: graph?.nodes.length ?? 0, edges: graph?.edges.length ?? 0 }
}

export { nodeCatalog }
