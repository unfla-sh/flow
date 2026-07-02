import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  useUpdateNodeInternals,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnectEnd,
} from '@xyflow/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from 'react'

import { useActiveFlow, useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowEdge as WorkflowEdgeType, WorkflowNode } from '@/types/workflow'

import { CanvasContextMenu, type ContextMenuState } from './CanvasContextMenu'
import { ConditionNode } from './nodes/ConditionNode'
import { DataNode } from './nodes/DataNode'
import { DecisionNode } from './nodes/DecisionNode'
import { FormNode } from './nodes/FormNode'
import { FrameNode } from './nodes/FrameNode'
import { MediaNode } from './nodes/MediaNode'
import { NoteNode } from './nodes/NoteNode'
import { ScriptNode } from './nodes/ScriptNode'
import { EndNode, StartNode } from './nodes/StartEndNode'
import { SubFlowNode } from './nodes/SubFlowNode'
import { SwitchNode } from './nodes/SwitchNode'
import { WorkflowEdge as WorkflowEdgeComponent } from './WorkflowEdge'

export const DND_MIME_TYPE = 'application/workflow-node'

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  script: ScriptNode,
  form: FormNode,
  data: DataNode,
  condition: ConditionNode,
  switch: SwitchNode,
  subflow: SubFlowNode,
  note: NoteNode,
  frame: FrameNode,
  media: MediaNode,
}

const edgeTypes: EdgeTypes = {
  workflow: WorkflowEdgeComponent,
}

export function FlowCanvas() {
  const { nodes, edges } = useActiveFlow()
  const presentationMode = useWorkflowStore((state) => state.presentationMode)
  const activeFlowDirection = useWorkflowStore((state) => {
    const flowId = state.activeFlowPath[state.activeFlowPath.length - 1]
    return state.doc.flows[flowId]?.settings?.direction ?? 'lr'
  })
  const activeFlowId = useWorkflowStore(
    (state) => state.activeFlowPath[state.activeFlowPath.length - 1],
  )
  const docInstanceId = useWorkflowStore((state) => state.docInstanceId)
  const sim = useWorkflowStore((state) => state.sim)
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)
  const onConnect = useWorkflowStore((state) => state.onConnect)
  const addNode = useWorkflowStore((state) => state.addNode)
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode)
  const setSelectedEdge = useWorkflowStore((state) => state.setSelectedEdge)
  const clearSelection = useWorkflowStore((state) => state.clearSelection)
  const openSubFlow = useWorkflowStore((state) => state.openSubFlow)

  const { screenToFlowPosition } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [connecting, setConnecting] = useState(false)
  // A connect-drag that ends on the pane also fires a pane click (mouseup on
  // the pane bubbles a click); without this flag that click would instantly
  // close the add-and-connect menu the drop just opened.
  const suppressPaneClick = useRef(false)
  const simActive = sim.status !== 'idle'
  const renderedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const simClass = !simActive
          ? undefined
          : sim.activeNodeIds.includes(node.id)
            ? 'wf-sim-active'
            : sim.doneNodeIds.includes(node.id)
              ? 'wf-sim-done'
              : undefined
        return {
          ...node,
          zIndex: node.data.nodeType === 'frame' ? 0 : (node.zIndex ?? 1),
          ...(simClass ? { className: [node.className, simClass].filter(Boolean).join(' ') } : {}),
        }
      }),
    [nodes, simActive, sim.activeNodeIds, sim.doneNodeIds],
  )
  const renderedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const withType = edge.type ? edge : { ...edge, type: 'workflow' }
        return simActive && sim.activeEdgeIds.includes(edge.id)
          ? { ...withType, animated: true }
          : withType
      }),
    [edges, simActive, sim.activeEdgeIds],
  )

  useEffect(() => {
    requestAnimationFrame(() => {
      updateNodeInternals(nodes.map((node) => node.id))
    })
  }, [activeFlowDirection, nodes, updateNodeInternals])

  const menuPosition = useCallback(
    (event: MouseEvent) => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      return {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      }
    },
    [screenToFlowPosition],
  )

  const onConnectStart = useCallback(() => setConnecting(true), [])

  // A connection dropped on empty canvas opens the add-node menu with the
  // drag origin attached, so picking an entry creates the node pre-wired.
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      setConnecting(false)
      if (useWorkflowStore.getState().presentationMode) return
      if (connectionState.isValid || connectionState.toNode) return
      const { fromNode, fromHandle } = connectionState
      if (!fromNode || !fromHandle) return
      const { clientX, clientY } =
        'changedTouches' in event ? event.changedTouches[0] : event
      const rect = wrapperRef.current?.getBoundingClientRect()
      suppressPaneClick.current = true
      setMenu({
        kind: 'pane',
        x: clientX - (rect?.left ?? 0),
        y: clientY - (rect?.top ?? 0),
        flowPosition: screenToFlowPosition({ x: clientX, y: clientY }),
        pendingConnection: {
          nodeId: fromNode.id,
          handleId: fromHandle.id ?? null,
          handleType: fromHandle.type,
        },
      })
    },
    [screenToFlowPosition],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    if (useWorkflowStore.getState().presentationMode) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      if (useWorkflowStore.getState().presentationMode) return
      const catalogId = event.dataTransfer.getData(DND_MIME_TYPE)
      if (!catalogId) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(catalogId, position)
    },
    [screenToFlowPosition, addNode],
  )

  const onNodeClick: NodeMouseHandler<WorkflowNode> = useCallback(
    (_, node) => setSelectedNode(node.id),
    [setSelectedNode],
  )

  const onNodeDoubleClick: NodeMouseHandler<WorkflowNode> = useCallback(
    (_, node) => {
      if (node.data.nodeType === 'subflow') openSubFlow(node.id)
    },
    [openSubFlow],
  )

  const onEdgeClick: EdgeMouseHandler<WorkflowEdgeType> = useCallback(
    (_, edge) => setSelectedEdge(edge.id),
    [setSelectedEdge],
  )

  const onNodeContextMenu: NodeMouseHandler<WorkflowNode> = useCallback(
    (event, node) => {
      if (useWorkflowStore.getState().presentationMode) return
      event.preventDefault()
      if (!node.selected) setSelectedNode(node.id)
      setMenu({
        kind: 'node',
        targetId: node.id,
        isSubflow: node.data.nodeType === 'subflow',
        ...menuPosition(event),
      })
    },
    [menuPosition, setSelectedNode],
  )

  const onEdgeContextMenu: EdgeMouseHandler<WorkflowEdgeType> = useCallback(
    (event, edge) => {
      if (useWorkflowStore.getState().presentationMode) return
      event.preventDefault()
      setSelectedEdge(edge.id)
      setMenu({ kind: 'edge', targetId: edge.id, ...menuPosition(event) })
    },
    [menuPosition, setSelectedEdge],
  )

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | globalThis.MouseEvent) => {
      if (useWorkflowStore.getState().presentationMode) return
      event.preventDefault()
      setMenu({ kind: 'pane', ...menuPosition(event as MouseEvent) })
    },
    [menuPosition],
  )

  const onPaneClick = useCallback(() => {
    if (suppressPaneClick.current) {
      suppressPaneClick.current = false
      return
    }
    clearSelection()
    setMenu(null)
  }, [clearSelection])

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      data-presentation={presentationMode ? 'true' : undefined}
      data-connecting={connecting ? 'true' : undefined}
    >
      <ReactFlow
        key={`${docInstanceId}:${activeFlowId}`}
        nodes={renderedNodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onMoveStart={() => setMenu(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isValidConnection={() => true}
        connectionRadius={36}
        nodesDraggable={!presentationMode}
        nodesConnectable={!presentationMode}
        edgesReconnectable={!presentationMode}
        deleteKeyCode={null}
        connectionMode={ConnectionMode.Loose}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        fitView
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
      {menu && <CanvasContextMenu menu={menu} onClose={() => setMenu(null)} />}
    </div>
  )
}
