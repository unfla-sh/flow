import type { Edge, Node } from '@xyflow/react'

export type NodeTypeId =
  | 'start'
  | 'end'
  | 'decision'
  | 'script'
  | 'form'
  | 'data'
  | 'condition'
  | 'switch'
  | 'subflow'
  | 'note'
  | 'frame'
  | 'media'

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'daterange'
  | 'select'
  | 'multiselect'
  | 'checkbox'

export interface FormField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  defaultValue?: unknown
}

export interface ScriptArg {
  id: string
  key: string
  value: string
}

/** One branch of a switch node; `id` doubles as the source-handle id. */
export interface SwitchCase {
  id: string
  when: string
}

/** Source-handle id of a switch node's fallback branch. */
export const SWITCH_DEFAULT_HANDLE = 'default'

/**
 * Explicit id for every node's plain target handle. Without an id, React
 * Flow's loose-mode handle lookup resolves a hovered target handle to the
 * node's FIRST source handle (sources are listed first), so the connection
 * preview snapped to e.g. a condition's "true" dot while hovering the
 * target. Edges still store `targetHandle: null` for this handle — the
 * store normalises it — so documents and the inspector are unaffected.
 */
export const TARGET_HANDLE_ID = 'in'

export type FlowDirection = 'lr' | 'tb'

export interface FlowSettings {
  direction?: FlowDirection
}

export interface NodeStyle {
  borderColor?: string
  fillColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  /** Custom background colour for the node's icon chip. */
  iconBg?: string
  /** Custom text/font colour for the node's labels. */
  textColor?: string
}

export interface EdgeRoute {
  kind: 'auto' | 'manual'
  points?: { x: number; y: number }[]
}

export interface EdgeStyle {
  stroke?: string
  arrow?: boolean
  arrowStart?: boolean
  bidirectional?: boolean
  lineWidth?: number
  arrowSize?: number
  /** Auto-route shape: curved bezier (default) or right-angle step. */
  pathType?: 'bezier' | 'step'
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  description?: string
  nodeType: NodeTypeId
  params: Record<string, unknown>
  style?: NodeStyle
  /** Icon registry name overriding the node type's default icon. */
  icon?: string
  formSchema?: FormField[]
  /** Branches of a switch node. */
  cases?: SwitchCase[]
  simulatedOutput?: unknown
  scriptPath?: string
  scriptSnippet?: string
  subFlowId?: string
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  condition?: string
  route?: EdgeRoute
  style?: EdgeStyle
}

export interface WorkflowSettings {
  name: string
  version: string
  description?: string
}

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge<WorkflowEdgeData>

export interface FlowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  settings?: FlowSettings
}

export const ROOT_FLOW_ID = 'root'

/** Provenance stamped onto exported files for debugging. */
export interface DocMeta {
  appVersion?: string
  exportedAt?: string
}

export interface WorkflowDoc {
  schemaVersion: 1
  settings: WorkflowSettings
  /** All flows in the document; ROOT_FLOW_ID is always present. */
  flows: Record<string, FlowGraph>
  /** Optional provenance, written on file export. */
  meta?: DocMeta
}

export interface ClipboardPayload {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  /** Deep copies of inner flows referenced by copied sub-flow nodes. */
  flows: Record<string, FlowGraph>
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  daterange: 'Date range',
  select: 'Select',
  multiselect: 'Multi-select',
  checkbox: 'Checkbox',
}
