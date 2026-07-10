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
  | 'scorecard'
  | 'profile'
  | 'record'
  | 'resource'

export type DiagramKind =
  | 'workflow'
  | 'organization'
  | 'database'
  | 'infrastructure'
  | 'image-generation'
  | 'general'

export type EdgeKind =
  | 'flow'
  | 'reporting'
  | 'relationship'
  | 'network'
  | 'data'
  | 'dependency'

export type EdgeCardinality = 'one' | 'zero-one' | 'many' | 'zero-many'

export interface NodeAttribute {
  id: string
  label: string
  value: string
}

export type RecordFieldKey = 'none' | 'primary' | 'foreign' | 'unique'

export interface RecordField {
  id: string
  name: string
  dataType: string
  key?: RecordFieldKey
  nullable?: boolean
}

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

/** One row of a score card: an entry with an optional glyph and value. */
export interface ScoreRow {
  /** Emoji or short glyph shown before the label (a flag, a dot, …). */
  icon?: string
  label: string
  /** Displayed as-is, so e.g. penalty shoot-outs can read "1 (3)". */
  value?: string
  /** Emphasise this row; the card mutes non-bold rows when any row is bold. */
  bold?: boolean
}

/**
 * Params of a score-card node — a compact results/comparison card: header
 * strip, one row per entry, bold rows emphasised. Fits tournament brackets,
 * leaderboards, A/B comparisons, election tallies, …
 */
export interface ScoreCardParams {
  /** Left side of the header strip, e.g. a venue or a category. */
  header?: string
  /** Right side of the header strip, e.g. "Full time" or a date. */
  tag?: string
  /** Small-caps caption above the card, e.g. "3RD-PLACE". */
  caption?: string
  /** Emoji rendered large above the card, e.g. "🏆" for a final. */
  emblem?: string
  /** Give bold rows a gold background (championship style). */
  accent?: boolean
  rows: ScoreRow[]
}

/** Read a node's params bag as score-card params (rows default to empty). */
export function scoreCardParamsOf(params: Record<string, unknown>): ScoreCardParams {
  const candidate = params as Partial<ScoreCardParams>
  return { ...candidate, rows: Array.isArray(candidate.rows) ? candidate.rows : [] }
}

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
  lineStyle?: 'solid' | 'dashed' | 'dotted'
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  description?: string
  nodeType: NodeTypeId
  /** Stable palette/kit definition. Several definitions may share one renderer. */
  definitionId?: string
  params: Record<string, unknown>
  style?: NodeStyle
  /** Icon registry name overriding the node type's default icon. */
  icon?: string
  formSchema?: FormField[]
  /** Branches of a switch node. */
  cases?: SwitchCase[]
  /** Reusable label/value rows used by profile and resource renderers. */
  attributes?: NodeAttribute[]
  /** Rows and connection points rendered by database/schema record nodes. */
  fields?: RecordField[]
  simulatedOutput?: unknown
  scriptPath?: string
  scriptSnippet?: string
  subFlowId?: string
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  kind?: EdgeKind
  condition?: string
  protocol?: string
  sourceCardinality?: EdgeCardinality
  targetCardinality?: EdgeCardinality
  route?: EdgeRoute
  style?: EdgeStyle
}

export interface WorkflowSettings {
  name: string
  version: string
  description?: string
  diagramKind?: DiagramKind
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
  /** Bundled template this doc was created from, for update detection. */
  templateId?: string
  /** The template's settings.version at load time (settings.version of the
   * copy is user-editable, so it can't be trusted for comparison). */
  templateVersion?: string
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
