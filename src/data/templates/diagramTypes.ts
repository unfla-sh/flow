import type {
  FlowGraph,
  NodeStyle,
  RecordField,
  WorkflowDoc,
  WorkflowEdge,
  WorkflowEdgeData,
  WorkflowNode,
  WorkflowNodeData,
} from '@/types/workflow'

import type { WorkflowTemplate } from './types'

/**
 * One starter template per diagram type, so every type has a working,
 * editable example in File ▸ New from template. Each stays small (about
 * nine nodes) — the point is to show the kit, not to be exhaustive.
 */

type NodeOpts = Partial<
  Pick<WorkflowNodeData, 'description' | 'icon' | 'style' | 'attributes' | 'params' | 'simulatedOutput'>
>

const WORKFLOW_TYPES: Record<string, WorkflowNodeData['nodeType']> = {
  start: 'start',
  end: 'end',
  script: 'script',
  delay: 'script',
  loop: 'condition',
  error_handler: 'condition',
  decision: 'decision',
  condition: 'condition',
  switch: 'switch',
  fetch: 'data',
  transform: 'data',
  output: 'data',
  form: 'form',
  note: 'note',
  subflow: 'subflow',
}

/** A workflow-kit node whose renderer follows from its definition id. */
function wf(id: string, definitionId: string, label: string, x: number, y: number, opts: NodeOpts = {}): WorkflowNode {
  const nodeType = WORKFLOW_TYPES[definitionId]
  const { params, ...rest } = opts
  return {
    id,
    type: nodeType,
    position: { x, y },
    data: { label, nodeType, definitionId, params: params ?? {}, ...rest },
  }
}

/** A resource card (components, services, states, work items). */
function res(id: string, definitionId: string, label: string, x: number, y: number, opts: NodeOpts = {}): WorkflowNode {
  const { params, attributes, ...rest } = opts
  return {
    id,
    type: 'resource',
    position: { x, y },
    data: { label, nodeType: 'resource', definitionId, params: params ?? {}, attributes: attributes ?? [], ...rest },
  }
}

/** A frame (backdrop) with explicit bounds. */
function frame(
  id: string,
  definitionId: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opts: NodeOpts = {},
): WorkflowNode {
  const { params, ...rest } = opts
  return {
    id,
    type: 'frame',
    position: { x, y },
    width,
    height,
    zIndex: -1,
    data: { label, nodeType: 'frame', definitionId, params: params ?? {}, ...rest },
  }
}

/** A record card (tables, classes). */
function rec(
  id: string,
  definitionId: string,
  label: string,
  x: number,
  y: number,
  fields: RecordField[],
  opts: NodeOpts & { operations?: string[]; recordKind?: string; namespace?: string } = {},
): WorkflowNode {
  const { operations, recordKind, namespace, params, ...rest } = opts
  return {
    id,
    type: 'record',
    position: { x, y },
    data: {
      label,
      nodeType: 'record',
      definitionId,
      params: { recordKind: recordKind ?? 'Table', namespace: namespace ?? 'public', ...params },
      fields,
      ...(operations ? { operations: operations.map((signature, i) => ({ id: `${id}-op${i + 1}`, signature })) } : {}),
      ...rest,
    },
  }
}

function field(id: string, name: string, dataType: string, extra: Partial<RecordField> = {}): RecordField {
  return { id, name, dataType, key: 'none', ...extra }
}

function attr(label: string, value: string) {
  return { id: `${label}-${value}`.replace(/\W+/g, '-').toLowerCase(), label, value }
}

type EdgeOpts = {
  label?: string
  sourceHandle?: string
  targetHandle?: string
  data?: WorkflowEdgeData
}

function edge(id: string, source: string, target: string, opts: EdgeOpts = {}): WorkflowEdge {
  const { label, sourceHandle, targetHandle, data } = opts
  return {
    id,
    source,
    target,
    ...(label ? { label } : {}),
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(targetHandle ? { targetHandle } : {}),
    data: data ?? { style: { arrow: true } },
  }
}

const ARROW: WorkflowEdgeData = { style: { arrow: true } }
const STEP: WorkflowEdgeData = { style: { arrow: true, pathType: 'step' } }
const NET: WorkflowEdgeData = { kind: 'network', style: { arrow: true, pathType: 'step' } }
const DATA: WorkflowEdgeData = { kind: 'data', style: { arrow: true } }
const DEP: WorkflowEdgeData = { kind: 'dependency', style: { arrow: true, lineStyle: 'dashed' } }
const TRANSITION: WorkflowEdgeData = { kind: 'transition', style: { arrow: true } }
const TREE: WorkflowEdgeData = { kind: 'reporting', style: { arrow: false, pathType: 'step' } }

const doc = (
  name: string,
  description: string,
  diagramKind: WorkflowDoc['settings']['diagramKind'],
  direction: 'lr' | 'tb',
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  extraFlows: Record<string, FlowGraph> = {},
): WorkflowDoc => ({
  schemaVersion: 1,
  settings: { name, version: '1.0.0', description, diagramKind },
  flows: { root: { settings: { direction }, nodes, edges }, ...extraFlows },
})

const BLUE: NodeStyle = { iconBg: '#dbeafe', borderColor: '#60a5fa' }
const AMBER: NodeStyle = { iconBg: '#fef3c7', borderColor: '#f59e0b' }
const GREEN: NodeStyle = { iconBg: '#dcfce7', borderColor: '#4ade80' }
const ROSE: NodeStyle = { iconBg: '#ffe4e6', borderColor: '#fb7185' }
const GREY: NodeStyle = { iconBg: '#f1f5f9', borderColor: '#94a3b8', textColor: '#64748b' }

// ───────────────────────── Structural ─────────────────────────

const architecture = doc(
  'Architecture',
  'Components and their connections: clients through a load balancer to services, data stores, and a queue-fed worker.',
  'infrastructure',
  'lr',
  [
    res('client', 'infra.client', 'Web & mobile clients', 0, 150, { params: { resourceType: 'Client' }, icon: 'user' }),
    res('lb', 'infra.load-balancer', 'Load balancer', 300, 150, { params: { resourceType: 'Load Balancer', environment: 'Production', status: 'Healthy' }, icon: 'shuffle' }),
    res('api', 'infra.service', 'API service', 600, 60, { params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' }, attributes: [attr('Port', '8080'), attr('Replicas', '3')], icon: 'cloud' }),
    res('web', 'infra.web-server', 'Web front end', 600, 260, { params: { resourceType: 'Web Server', environment: 'Production', status: 'Healthy' }, icon: 'globe' }),
    res('db', 'infra.database-server', 'PostgreSQL', 920, 0, { params: { resourceType: 'Database Server', environment: 'Production', status: 'Healthy' }, icon: 'database' }),
    res('cache', 'infra.cache', 'Redis cache', 920, 150, { params: { resourceType: 'Cache', environment: 'Production', status: 'Healthy' }, icon: 'zap' }),
    res('queue', 'infra.queue', 'Jobs queue', 920, 300, { params: { resourceType: 'Queue', environment: 'Production', status: 'Healthy' }, attributes: [attr('Topic', 'jobs')], icon: 'message' }),
    res('worker', 'infra.service', 'Background worker', 1240, 300, { params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' }, icon: 'cpu' }),
  ],
  [
    edge('e1', 'client', 'lb', { label: 'HTTPS :443', data: NET }),
    edge('e2', 'lb', 'api', { label: 'HTTP :8080', data: NET }),
    edge('e3', 'lb', 'web', { label: 'HTTP :3000', data: NET }),
    edge('e4', 'api', 'db', { label: 'SQL :5432', data: { kind: 'network', style: { arrow: true, arrowStart: true, pathType: 'step' } } }),
    edge('e5', 'api', 'cache', { label: 'RESP :6379', data: NET }),
    edge('e6', 'api', 'queue', { label: 'publish', data: NET }),
    edge('e7', 'queue', 'worker', { label: 'consume', data: NET }),
    edge('e8', 'worker', 'db', { label: 'SQL', sourceHandle: 'top', targetHandle: 'right', data: { kind: 'network', style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
  ],
)

const itCurrentState = doc(
  'IT current-state',
  'The legacy landscape grouped by what happens next: retire, migrate, or invest. Frames are the phases; arrows are live integrations.',
  'infrastructure',
  'lr',
  [
    frame('f-retire', 'infra.network-zone', 'Retire', 0, 0, 340, 420, { params: { caption: '2026 H1' }, icon: 'alert', style: { fillColor: '#fff1f2', borderColor: '#fda4af', borderStyle: 'solid' } }),
    frame('f-migrate', 'infra.network-zone', 'Migrate', 380, 0, 340, 420, { params: { caption: '2026 H2' }, icon: 'shuffle', style: { fillColor: '#fffbeb', borderColor: '#fcd34d', borderStyle: 'solid' } }),
    frame('f-invest', 'infra.network-zone', 'Invest', 760, 0, 340, 420, { params: { caption: 'ongoing' }, icon: 'rocket', style: { fillColor: '#f0fdf4', borderColor: '#86efac', borderStyle: 'solid' } }),
    res('mainframe', 'infra.external', 'Mainframe billing', 60, 60, { params: { resourceType: 'External', status: 'Degraded' }, icon: 'server', style: ROSE }),
    res('fax', 'infra.external', 'Fax intake', 60, 220, { params: { resourceType: 'External', status: 'Degraded' }, icon: 'file', style: ROSE }),
    res('crm', 'infra.app-server', 'On-prem CRM', 440, 60, { params: { resourceType: 'Application Server', environment: 'On-prem', status: 'Healthy' }, icon: 'users', style: AMBER }),
    res('erp', 'infra.app-server', 'ERP v9', 440, 220, { params: { resourceType: 'Application Server', environment: 'On-prem', status: 'Warning' }, icon: 'clipboard', style: AMBER }),
    res('portal', 'infra.service', 'Customer portal', 820, 60, { params: { resourceType: 'Service', environment: 'Cloud', status: 'Healthy' }, icon: 'globe', style: GREEN }),
    res('lake', 'infra.storage', 'Data lake', 820, 220, { params: { resourceType: 'Object storage', environment: 'Cloud', status: 'Healthy' }, icon: 'database', style: GREEN }),
  ],
  [
    edge('e1', 'mainframe', 'crm', { label: 'nightly batch', data: { kind: 'network', style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
    edge('e2', 'fax', 'erp', { label: 'manual re-key', data: { kind: 'network', style: { arrow: true, pathType: 'step', lineStyle: 'dotted' } } }),
    edge('e3', 'crm', 'portal', { label: 'REST', data: NET }),
    edge('e4', 'erp', 'lake', { label: 'CDC', data: NET }),
    edge('e5', 'crm', 'lake', { label: 'export', data: NET }),
  ],
)

const flowchart = doc(
  'Flowchart',
  'Decision logic with branches: a request is checked, routed, and either fulfilled or escalated.',
  'workflow',
  'tb',
  [
    wf('start', 'start', 'Request received', 300, 0),
    wf('validate', 'script', 'Validate request', 270, 100, { description: 'schema + permissions' }),
    wf('ok', 'decision', 'Valid?', 262, 230, { params: { expression: 'valid' } }),
    wf('reject', 'output', 'Return error', 620, 460, { icon: 'alert' }),
    wf('urgent', 'decision', 'Urgent?', 0, 430, { params: { expression: 'priority == "high"' } }),
    wf('fast', 'script', 'Fast-track queue', -180, 640, { icon: 'zap' }),
    wf('normal', 'script', 'Standard queue', 200, 640, { icon: 'clock' }),
    wf('done', 'end', 'Fulfilled', 60, 790),
    wf('failed', 'end', 'Rejected', 680, 620),
  ],
  [
    edge('e1', 'start', 'validate'),
    edge('e2', 'validate', 'ok'),
    edge('e3', 'ok', 'urgent', { sourceHandle: 'true', label: 'yes' }),
    edge('e4', 'ok', 'reject', { sourceHandle: 'false', label: 'no' }),
    edge('e5', 'urgent', 'fast', { sourceHandle: 'true', label: 'yes' }),
    edge('e6', 'urgent', 'normal', { sourceHandle: 'false', label: 'no' }),
    edge('e7', 'fast', 'done'),
    edge('e8', 'normal', 'done'),
    edge('e9', 'reject', 'failed'),
  ],
)

const stateMachine = doc(
  'State machine',
  'States, transitions, and guards for a document lifecycle. Run the simulation to walk it; edit guards on the transitions.',
  'state',
  'lr',
  [
    wf('initial', 'start', 'initial', 0, 130),
    res('draft', 'state.state', 'Draft', 160, 100, { params: { resourceType: 'State' }, attributes: [attr('entry', 'lock for author'), attr('exit', 'snapshot')], icon: 'file', style: { iconBg: '#ede9fe', borderColor: '#8b5cf6' } }),
    res('review', 'state.state', 'In review', 480, 100, { params: { resourceType: 'State' }, attributes: [attr('entry', 'notify reviewers')], icon: 'eye', style: { iconBg: '#ede9fe', borderColor: '#8b5cf6' } }),
    wf('choice', 'decision', 'approved?', 780, 96, { params: { expression: 'approved' } }),
    res('published', 'state.state', 'Published', 1080, 0, { params: { resourceType: 'State' }, attributes: [attr('entry', 'publish to CDN')], icon: 'check', style: GREEN }),
    res('changes', 'state.state', 'Changes requested', 1080, 220, { params: { resourceType: 'State' }, attributes: [attr('entry', 'email author')], icon: 'alert', style: AMBER }),
    wf('final', 'end', 'archived', 1380, 40),
  ],
  [
    edge('e1', 'initial', 'draft', { data: TRANSITION }),
    edge('e2', 'draft', 'review', { label: 'submit [complete]', data: TRANSITION }),
    edge('e3', 'review', 'choice', { label: 'decide', data: TRANSITION }),
    edge('e4', 'choice', 'published', { sourceHandle: 'true', label: '[approved]', data: TRANSITION }),
    edge('e5', 'choice', 'changes', { sourceHandle: 'false', label: '[rejected]', data: TRANSITION }),
    edge('e6', 'changes', 'draft', { label: 'revise', sourceHandle: 'bottom', targetHandle: 'bottom', data: { kind: 'transition', style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
    edge('e7', 'published', 'final', { label: 'archive [after 1y]', data: TRANSITION }),
  ],
)

const swimlane = doc(
  'Swimlane',
  'A cross-functional process with hand-offs: each lane is one role, arrows crossing lanes are the hand-offs.',
  'workflow',
  'lr',
  [
    frame('lane-customer', 'process.lane', 'Customer', 0, 0, 1240, 170, { icon: 'user' }),
    frame('lane-sales', 'process.lane', 'Sales', 0, 190, 1240, 170, { icon: 'users', style: { fillColor: '#f8fafc', borderColor: '#d4d4d8', borderStyle: 'solid' } }),
    frame('lane-finance', 'process.lane', 'Finance', 0, 380, 1240, 170, { icon: 'dollar' }),
    wf('start', 'start', 'Need identified', 40, 60),
    wf('request', 'form', 'Submit request', 300, 40, { icon: 'clipboard' }),
    wf('quote', 'script', 'Prepare quote', 300, 230, { icon: 'file' }),
    wf('approve', 'decision', 'Changes needed?', 580, 20, { params: { expression: 'needs_changes' } }),
    wf('invoice', 'script', 'Raise invoice', 880, 420, { icon: 'dollar' }),
    wf('renegotiate', 'script', 'Revise terms', 880, 230, { icon: 'repeat' }),
    wf('end', 'end', 'Paid', 1140, 440),
  ],
  [
    edge('e1', 'start', 'request'),
    edge('e2', 'request', 'quote', { label: 'hand-off', data: STEP }),
    edge('e3', 'quote', 'approve', { data: STEP }),
    edge('e4', 'approve', 'invoice', { sourceHandle: 'false', label: 'no', data: STEP }),
    edge('e5', 'approve', 'renegotiate', { sourceHandle: 'true', label: 'yes', targetHandle: 'top', data: STEP }),
    edge('e6', 'renegotiate', 'quote', { label: 'again', sourceHandle: 'bottom', targetHandle: 'bottom', data: { style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
    edge('e7', 'invoice', 'end'),
  ],
)

// ───────────────────────── Hierarchy ─────────────────────────

const nested = doc(
  'Nested',
  'Hierarchy through containment: frames inside frames show scope, from platform down to individual services.',
  'general',
  'lr',
  [
    frame('platform', 'frame', 'Platform', 0, 0, 900, 520, { icon: 'cloud', style: { fillColor: '#f8fafc', borderColor: '#94a3b8', borderStyle: 'solid' } }),
    frame('region-eu', 'frame', 'Region eu-west', 30, 50, 410, 440, { icon: 'map-pin', style: { fillColor: '#eff6ff', borderColor: '#93c5fd', borderStyle: 'solid' } }),
    frame('region-us', 'frame', 'Region us-east', 460, 50, 410, 440, { icon: 'map-pin', style: { fillColor: '#eff6ff', borderColor: '#93c5fd', borderStyle: 'solid' } }),
    frame('cluster-eu', 'frame', 'Cluster prod', 60, 110, 350, 350, { icon: 'layers', style: { fillColor: '#ffffff', borderColor: '#cbd5e1', borderStyle: 'dashed' } }),
    frame('cluster-us', 'frame', 'Cluster prod', 490, 110, 350, 350, { icon: 'layers', style: { fillColor: '#ffffff', borderColor: '#cbd5e1', borderStyle: 'dashed' } }),
    res('api-eu', 'general.component', 'api', 130, 170, { icon: 'cloud', style: BLUE }),
    res('db-eu', 'general.component', 'postgres', 130, 320, { icon: 'database', style: BLUE }),
    res('api-us', 'general.component', 'api', 560, 170, { icon: 'cloud', style: BLUE }),
    res('db-us', 'general.component', 'postgres', 560, 320, { icon: 'database', style: BLUE }),
  ],
  [
    edge('e1', 'api-eu', 'db-eu', { data: STEP }),
    edge('e2', 'api-us', 'db-us', { data: STEP }),
    edge('e3', 'db-eu', 'db-us', { label: 'replication', sourceHandle: 'right', targetHandle: 'left', data: { kind: 'data', style: { arrow: true, arrowStart: true, pathType: 'step', lineStyle: 'dashed' } } }),
  ],
)

const tree = doc(
  'Tree',
  'Parent → children relationships. Plain components joined by right-angle lines; drag a child to re-parent it.',
  'general',
  'tb',
  [
    res('root', 'general.component', 'Product catalogue', 480, 0, { icon: 'folder', style: BLUE }),
    res('c1', 'general.component', 'Hardware', 160, 160, { icon: 'cpu' }),
    res('c2', 'general.component', 'Software', 480, 160, { icon: 'code' }),
    res('c3', 'general.component', 'Services', 800, 160, { icon: 'wrench' }),
    res('g1', 'general.component', 'Laptops', 0, 320, { icon: 'box' }),
    res('g2', 'general.component', 'Phones', 300, 320, { icon: 'box' }),
    res('g3', 'general.component', 'Licences', 480, 320, { icon: 'key' }),
    res('g4', 'general.component', 'Support plans', 800, 320, { icon: 'heart' }),
  ],
  [
    edge('e1', 'root', 'c1', { data: TREE }),
    edge('e2', 'root', 'c2', { data: TREE }),
    edge('e3', 'root', 'c3', { data: TREE }),
    edge('e4', 'c1', 'g1', { data: TREE }),
    edge('e5', 'c1', 'g2', { data: TREE }),
    edge('e6', 'c2', 'g3', { data: TREE }),
    edge('e7', 'c3', 'g4', { data: TREE }),
  ],
)

const layerStack = doc(
  'Layer stack',
  'Stacked abstraction levels. Each band is a layer; components sit inside the layer they belong to.',
  'general',
  'tb',
  [
    frame('l1', 'general.layer', 'Presentation', 0, 0, 900, 140, { params: { caption: 'React, mobile' }, icon: 'eye', style: { fillColor: '#eff6ff', borderColor: '#93c5fd', borderStyle: 'solid' } }),
    frame('l2', 'general.layer', 'API', 0, 160, 900, 140, { params: { caption: 'REST, GraphQL' }, icon: 'network', style: { fillColor: '#f5f3ff', borderColor: '#c4b5fd', borderStyle: 'solid' } }),
    frame('l3', 'general.layer', 'Domain', 0, 320, 900, 140, { params: { caption: 'business rules' }, icon: 'brain', style: { fillColor: '#fefce8', borderColor: '#fde047', borderStyle: 'solid' } }),
    frame('l4', 'general.layer', 'Data', 0, 480, 900, 140, { params: { caption: 'storage' }, icon: 'database', style: { fillColor: '#f0fdf4', borderColor: '#86efac', borderStyle: 'solid' } }),
    res('web', 'general.component', 'Web app', 60, 40, { icon: 'globe' }),
    res('mobile', 'general.component', 'Mobile app', 340, 40, { icon: 'user' }),
    res('gateway', 'general.component', 'API gateway', 200, 200, { icon: 'network' }),
    res('orders', 'general.component', 'Orders service', 60, 360, { icon: 'cart' }),
    res('billing', 'general.component', 'Billing service', 340, 360, { icon: 'dollar' }),
    res('pg', 'general.component', 'PostgreSQL', 200, 520, { icon: 'database' }),
  ],
  [
    edge('e1', 'web', 'gateway', { data: STEP }),
    edge('e2', 'mobile', 'gateway', { data: STEP }),
    edge('e3', 'gateway', 'orders', { data: STEP }),
    edge('e4', 'gateway', 'billing', { data: STEP }),
    edge('e5', 'orders', 'pg', { data: STEP }),
    edge('e6', 'billing', 'pg', { data: STEP }),
  ],
)

const umlClass = doc(
  'UML class',
  'Classes with attributes and operations. Open triangles are inheritance, a filled diamond is composition, plain lines are associations.',
  'uml',
  'tb',
  [
    rec('payable', 'uml.interface', 'Payable', 640, 0, [], { recordKind: 'Interface', namespace: '«interface»', operations: ['+ charge(amount: Money): Receipt'], icon: 'code-tags', style: { borderStyle: 'dashed' } }),
    rec('customer', 'uml.class', 'Customer', 0, 240, [field('c1', '- id', 'UUID'), field('c2', '- email', 'String'), field('c3', '- tier', 'Tier')], { recordKind: 'Class', namespace: '', operations: ['+ placeOrder(lines): Order', '+ upgrade(): void'], icon: 'code-tags' }),
    rec('order', 'uml.class', 'Order', 380, 240, [field('o1', '- id', 'UUID'), field('o2', '- status', 'OrderStatus'), field('o3', '- placedAt', 'DateTime')], { recordKind: 'Class', namespace: '', operations: ['+ total(): Money', '+ cancel(): void'], icon: 'code-tags' }),
    rec('line', 'uml.class', 'OrderLine', 380, 560, [field('l1', '- qty', 'int'), field('l2', '- unitPrice', 'Money')], { recordKind: 'Class', namespace: '', operations: ['+ subtotal(): Money'], icon: 'code-tags' }),
    rec('card', 'uml.class', 'CardPayment', 760, 240, [field('p1', '- last4', 'String'), field('p2', '- network', 'String')], { recordKind: 'Class', namespace: '', operations: ['+ charge(amount: Money): Receipt'], icon: 'card' }),
    rec('status', 'uml.enum', 'OrderStatus', 0, 560, [field('s1', 'NEW', ''), field('s2', 'PAID', ''), field('s3', 'SHIPPED', ''), field('s4', 'CANCELLED', '')], { recordKind: 'Enum', namespace: '«enumeration»', operations: [], icon: 'tag' }),
  ],
  [
    edge('e1', 'customer', 'order', { label: '1 places 0..*', sourceHandle: 'right', targetHandle: 'left', data: { kind: 'association', style: { arrow: true, pathType: 'step' } } }),
    edge('e2', 'order', 'line', { label: '1..*', sourceHandle: 'bottom', targetHandle: 'top', data: { kind: 'association', style: { arrow: false, arrowStart: true, arrowStartShape: 'diamond', pathType: 'step' } } }),
    edge('e3', 'card', 'payable', { label: 'realises', sourceHandle: 'top', targetHandle: 'bottom', data: { kind: 'association', style: { arrow: true, arrowShape: 'open-triangle', pathType: 'step', lineStyle: 'dashed' } } }),
    edge('e4', 'order', 'card', { label: 'paid with', sourceHandle: 'right', targetHandle: 'left', data: { kind: 'association', style: { arrow: false, pathType: 'step' } } }),
    edge('e5', 'order', 'status', { label: 'uses', sourceHandle: 'field:o2:left', targetHandle: 'right', data: { kind: 'association', style: { arrow: true, pathType: 'step', lineStyle: 'dotted' } } }),
  ],
)

const storyMap = doc(
  'Story map',
  'The narrative backbone across the top, user tasks beneath each activity, and release bands slicing what ships together.',
  'planning',
  'tb',
  [
    frame('r1', 'plan.release', 'Release 1 · MVP', 0, 150, 1220, 190, { icon: 'rocket' }),
    frame('r2', 'plan.release', 'Release 2', 0, 360, 1220, 190, { icon: 'rocket', style: { fillColor: '#fefce8', borderColor: '#fde047', borderStyle: 'dashed' } }),
    res('a1', 'plan.activity', 'Find a product', 20, 0, { params: { resourceType: 'Activity' }, icon: 'search', style: AMBER }),
    res('a2', 'plan.activity', 'Choose options', 320, 0, { params: { resourceType: 'Activity' }, icon: 'settings', style: AMBER }),
    res('a3', 'plan.activity', 'Pay', 620, 0, { params: { resourceType: 'Activity' }, icon: 'card', style: AMBER }),
    res('a4', 'plan.activity', 'Track order', 920, 0, { params: { resourceType: 'Activity' }, icon: 'truck', style: AMBER }),
    res('t1', 'plan.card', 'Search by keyword', 20, 200, { params: { resourceType: 'Story', status: 'Done' }, attributes: [attr('Size', '3')], icon: 'check' }),
    res('t2', 'plan.card', 'Pick size & colour', 320, 200, { params: { resourceType: 'Story', status: 'Ready' }, attributes: [attr('Size', '2')], icon: 'check' }),
    res('t3', 'plan.card', 'Pay by card', 620, 200, { params: { resourceType: 'Story', status: 'Ready' }, attributes: [attr('Size', '5')], icon: 'check' }),
    res('t4', 'plan.card', 'Email confirmation', 920, 200, { params: { resourceType: 'Story', status: 'Ready' }, attributes: [attr('Size', '1')], icon: 'check' }),
    res('t5', 'plan.card', 'Filter by price', 20, 410, { params: { resourceType: 'Story', status: 'Backlog' }, attributes: [attr('Size', '3')], icon: 'check' }),
    res('t6', 'plan.card', 'Apple / Google Pay', 620, 410, { params: { resourceType: 'Story', status: 'Backlog' }, attributes: [attr('Size', '5')], icon: 'check' }),
    res('t7', 'plan.card', 'Live map tracking', 920, 410, { params: { resourceType: 'Story', status: 'Backlog' }, attributes: [attr('Size', '8')], icon: 'check' }),
  ],
  [
    edge('e1', 'a1', 'a2', { data: { kind: 'flow', style: { arrow: true } } }),
    edge('e2', 'a2', 'a3', { data: { kind: 'flow', style: { arrow: true } } }),
    edge('e3', 'a3', 'a4', { data: { kind: 'flow', style: { arrow: true } } }),
  ],
)

// ───────────────────────── Flow & process ─────────────────────────

const loop = doc(
  'Loop / flywheel',
  'A reinforcing cycle: each step feeds the next and the last feeds the first. Change any label; the ring stays.',
  'workflow',
  'lr',
  [
    res('s1', 'general.component', 'More content', 360, 0, { icon: 'file', style: BLUE }),
    res('s2', 'general.component', 'More visitors', 720, 140, { icon: 'users', style: BLUE }),
    res('s3', 'general.component', 'More data', 720, 400, { icon: 'database', style: BLUE }),
    res('s4', 'general.component', 'Better recommendations', 360, 540, { icon: 'sparkles', style: BLUE }),
    res('s5', 'general.component', 'More creators', 0, 400, { icon: 'star', style: BLUE }),
    res('s6', 'general.component', 'More revenue', 0, 140, { icon: 'dollar', style: BLUE }),
    wf('note', 'note', 'Flywheel', 300, 250, { params: { text: 'Each turn makes the next turn easier. Break any arrow and the loop stalls.' } }),
  ],
  [
    edge('e1', 's1', 's2', { sourceHandle: 'right', targetHandle: 'top', data: ARROW }),
    edge('e2', 's2', 's3', { sourceHandle: 'bottom', targetHandle: 'top', data: ARROW }),
    edge('e3', 's3', 's4', { sourceHandle: 'left', targetHandle: 'right', data: ARROW }),
    edge('e4', 's4', 's5', { sourceHandle: 'left', targetHandle: 'bottom', data: ARROW }),
    edge('e5', 's5', 's6', { sourceHandle: 'top', targetHandle: 'bottom', data: ARROW }),
    edge('e6', 's6', 's1', { sourceHandle: 'top', targetHandle: 'left', data: ARROW }),
  ],
)

const highLevel = doc(
  'High-Level',
  'An end-to-end data stack: sources feed ingestion, storage and processing run on a cluster, serving feeds consumers.',
  'infrastructure',
  'lr',
  [
    frame('cluster', 'infra.network-zone', 'Kubernetes cluster', 320, -40, 660, 400, { icon: 'layers' }),
    res('src1', 'infra.external', 'SaaS APIs', 0, 20, { params: { resourceType: 'External' }, icon: 'globe' }),
    res('src2', 'infra.external', 'Operational DBs', 0, 200, { params: { resourceType: 'External' }, icon: 'database' }),
    res('ingest', 'infra.service', 'Ingestion', 360, 100, { params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' }, icon: 'download' }),
    res('lake', 'infra.storage', 'Lakehouse', 660, 0, { params: { resourceType: 'Object storage', environment: 'Production', status: 'Healthy' }, icon: 'database' }),
    res('process', 'infra.service', 'Processing jobs', 660, 200, { params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' }, icon: 'cpu' }),
    res('serve', 'infra.service', 'Serving API', 1020, 100, { params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' }, icon: 'send' }),
    res('bi', 'infra.client', 'Dashboards', 1340, 20, { params: { resourceType: 'Client' }, icon: 'activity' }),
    res('ml', 'infra.client', 'ML models', 1340, 200, { params: { resourceType: 'Client' }, icon: 'brain' }),
  ],
  [
    edge('e1', 'src1', 'ingest', { label: 'REST', data: NET }),
    edge('e2', 'src2', 'ingest', { label: 'CDC', data: NET }),
    edge('e3', 'ingest', 'lake', { label: 'parquet', data: DATA }),
    edge('e4', 'lake', 'process', { label: 'read', sourceHandle: 'bottom', targetHandle: 'top', data: DATA }),
    edge('e5', 'process', 'lake', { label: 'write', sourceHandle: 'left', targetHandle: 'left', data: { kind: 'data', style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
    edge('e6', 'lake', 'serve', { label: 'query', data: NET }),
    edge('e7', 'serve', 'bi', { data: NET }),
    edge('e8', 'serve', 'ml', { data: NET }),
  ],
)

const process = doc(
  'Process',
  'A multi-actor sequential process with the data handed over at each step shown between the steps.',
  'workflow',
  'lr',
  [
    wf('start', 'start', 'Claim submitted', 0, 120),
    wf('intake', 'form', 'Intake form', 220, 100, { description: 'Customer', icon: 'clipboard' }),
    wf('d1', 'output', 'Claim record', 500, 100, { description: 'JSON', icon: 'file', simulatedOutput: { claimId: 'C-1042', amount: 1200 } }),
    wf('assess', 'script', 'Assess damage', 760, 100, { description: 'Adjuster', icon: 'search' }),
    wf('d2', 'output', 'Assessment report', 1040, 100, { description: 'PDF', icon: 'file' }),
    wf('approve', 'decision', 'Approve payout?', 1290, 90, { params: { expression: 'amount < 5000' } }),
    wf('pay', 'script', 'Pay claimant', 1600, 40, { description: 'Finance', icon: 'dollar' }),
    wf('escalate', 'script', 'Escalate to senior adjuster', 1600, 260, { description: 'Claims lead', icon: 'alert' }),
    wf('end', 'end', 'Closed', 1900, 60),
  ],
  [
    edge('e1', 'start', 'intake'),
    edge('e2', 'intake', 'd1', { data: DATA }),
    edge('e3', 'd1', 'assess', { data: DATA }),
    edge('e4', 'assess', 'd2', { data: DATA }),
    edge('e5', 'd2', 'approve', { data: DATA }),
    edge('e6', 'approve', 'pay', { sourceHandle: 'true', label: 'yes' }),
    edge('e7', 'approve', 'escalate', { sourceHandle: 'false', label: 'no' }),
    edge('e8', 'pay', 'end'),
    edge('e9', 'escalate', 'assess', { label: 'second opinion', sourceHandle: 'bottom', targetHandle: 'bottom', data: { style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } } }),
  ],
)

const dataFlow = doc(
  'Data flow',
  'Role-scoped data flow: who does what at each step, with the payload named on every arrow.',
  'workflow',
  'lr',
  [
    frame('lane-analyst', 'process.lane', 'Analyst', 0, 0, 1240, 170, { icon: 'user' }),
    frame('lane-pipeline', 'process.lane', 'Pipeline', 0, 190, 1240, 170, { icon: 'workflow', style: { fillColor: '#f8fafc', borderColor: '#d4d4d8', borderStyle: 'solid' } }),
    frame('lane-warehouse', 'process.lane', 'Warehouse', 0, 380, 1240, 170, { icon: 'database' }),
    wf('define', 'form', 'Define metric', 40, 40, { icon: 'clipboard' }),
    wf('extract', 'fetch', 'Extract events', 360, 230, { params: { method: 'GET', url: 'https://events.internal/export' }, icon: 'download' }),
    wf('transform', 'transform', 'Aggregate daily', 660, 230, { params: { expression: 'sum(amount) by day' }, icon: 'filter' }),
    wf('load', 'output', 'metrics.daily', 960, 420, { icon: 'table' }),
    wf('report', 'output', 'Dashboard', 960, 40, { icon: 'activity' }),
  ],
  [
    edge('e1', 'define', 'extract', { label: 'metric spec (YAML)', data: { kind: 'data', style: { arrow: true, pathType: 'step' } } }),
    edge('e2', 'extract', 'transform', { label: 'raw events (JSON)', data: DATA }),
    edge('e3', 'transform', 'load', { label: 'rows (parquet)', data: { kind: 'data', style: { arrow: true, pathType: 'step' } } }),
    edge('e4', 'load', 'report', { label: 'SQL query', sourceHandle: 'top', targetHandle: 'bottom', data: { kind: 'data', style: { arrow: true, pathType: 'step' } } }),
  ],
)

const kanban = doc(
  'Kanban',
  'Work-in-progress by state with WIP limits on the columns. Drag a card between columns; the limit is the caption on each column.',
  'planning',
  'lr',
  [
    frame('c1', 'plan.column', 'Backlog', 0, 0, 260, 520, { params: { caption: '' }, icon: 'clipboard' }),
    frame('c2', 'plan.column', 'To do', 290, 0, 260, 520, { params: { caption: 'WIP 4' }, icon: 'clipboard' }),
    frame('c3', 'plan.column', 'Doing', 580, 0, 260, 520, { params: { caption: 'WIP 2' }, icon: 'play', style: { fillColor: '#fffbeb', borderColor: '#fcd34d', borderStyle: 'solid' } }),
    frame('c4', 'plan.column', 'Done', 870, 0, 260, 520, { params: { caption: '' }, icon: 'check', style: { fillColor: '#f0fdf4', borderColor: '#86efac', borderStyle: 'solid' } }),
    res('k1', 'plan.card', 'Design onboarding', 26, 50, { params: { resourceType: 'Story', status: 'Backlog' }, attributes: [attr('Owner', '—'), attr('Size', '5')], icon: 'check' }),
    res('k2', 'plan.card', 'Fix export bug', 26, 190, { params: { resourceType: 'Bug', status: 'Backlog' }, attributes: [attr('Owner', '—'), attr('Size', '2')], icon: 'bug', style: ROSE }),
    res('k3', 'plan.card', 'Add SSO login', 316, 50, { params: { resourceType: 'Story', status: 'Ready' }, attributes: [attr('Owner', 'Ana'), attr('Size', '8')], icon: 'check' }),
    res('k4', 'plan.card', 'Rate limiting', 606, 50, { params: { resourceType: 'Story', status: 'Active' }, attributes: [attr('Owner', 'Ben'), attr('Size', '3')], icon: 'check', style: AMBER }),
    res('k5', 'plan.card', 'Audit log', 606, 190, { params: { resourceType: 'Story', status: 'Active' }, attributes: [attr('Owner', 'Cy'), attr('Size', '5')], icon: 'check', style: AMBER }),
    res('k6', 'plan.card', 'Billing page', 896, 50, { params: { resourceType: 'Story', status: 'Done' }, attributes: [attr('Owner', 'Ana'), attr('Size', '3')], icon: 'check', style: GREEN }),
  ],
  [edge('e1', 'k3', 'k4', { label: 'blocked by', data: DEP })],
)

const deployment = doc(
  'Deployment',
  'Where software runs: zones contain hosts, hosts contain artifacts, and replicas are just repeated artifacts.',
  'infrastructure',
  'lr',
  [
    frame('zone-public', 'infra.network-zone', 'Public subnet', 0, 0, 340, 460, { icon: 'globe' }),
    frame('zone-private', 'infra.network-zone', 'Private subnet', 380, 0, 700, 460, { icon: 'lock' }),
    frame('host-lb', 'infra.host', 'lb-01', 30, 50, 280, 180, { params: { caption: 't3.small' }, icon: 'server' }),
    frame('host-app1', 'infra.host', 'app-01', 410, 50, 300, 380, { params: { caption: 'c6.large' }, icon: 'server' }),
    frame('host-db', 'infra.host', 'db-01', 750, 50, 300, 380, { params: { caption: 'r6.xlarge' }, icon: 'server' }),
    res('nginx', 'infra.service', 'nginx', 60, 100, { params: { resourceType: 'Service', status: 'Healthy' }, attributes: [attr('Port', '443')], icon: 'shuffle' }),
    res('api-1', 'infra.service', 'api (replica 1)', 440, 100, { params: { resourceType: 'Service', status: 'Healthy' }, attributes: [attr('Image', 'api:2.4.1')], icon: 'cloud' }),
    res('api-2', 'infra.service', 'api (replica 2)', 440, 250, { params: { resourceType: 'Service', status: 'Healthy' }, attributes: [attr('Image', 'api:2.4.1')], icon: 'cloud' }),
    res('pg', 'infra.database-server', 'postgres 16', 780, 100, { params: { resourceType: 'Database Server', status: 'Healthy' }, attributes: [attr('Volume', '500 GiB')], icon: 'database' }),
    res('pgbouncer', 'infra.service', 'pgbouncer', 780, 250, { params: { resourceType: 'Service', status: 'Healthy' }, icon: 'shuffle' }),
  ],
  [
    edge('e1', 'nginx', 'api-1', { label: ':8080', data: NET }),
    edge('e2', 'nginx', 'api-2', { label: ':8080', data: NET }),
    edge('e3', 'api-1', 'pgbouncer', { label: ':6432', data: NET }),
    edge('e4', 'api-2', 'pgbouncer', { label: ':6432', data: NET }),
    edge('e5', 'pgbouncer', 'pg', { label: ':5432', sourceHandle: 'top', targetHandle: 'bottom', data: NET }),
  ],
)

const dependencyGraph = doc(
  'Dependency graph',
  'What depends on what. Fan-in shows shared libraries; the dashed red pair is a cycle worth breaking.',
  'general',
  'lr',
  [
    res('app', 'general.component', 'web-app', 0, 160, { icon: 'globe', style: BLUE }),
    res('auth', 'general.component', 'auth-lib', 320, 0, { icon: 'lock' }),
    res('http', 'general.component', 'http-client', 320, 160, { icon: 'network' }),
    res('ui', 'general.component', 'ui-kit', 320, 320, { icon: 'image' }),
    res('log', 'general.component', 'logging', 640, 80, { icon: 'file', style: GREY }),
    res('config', 'general.component', 'config', 640, 240, { icon: 'settings', style: GREY }),
    res('core', 'general.component', 'core-utils', 960, 160, { icon: 'box', style: GREY }),
  ],
  [
    edge('e1', 'app', 'auth', { data: DEP }),
    edge('e2', 'app', 'http', { data: DEP }),
    edge('e3', 'app', 'ui', { data: DEP }),
    edge('e4', 'auth', 'http', { sourceHandle: 'bottom', targetHandle: 'top', data: DEP }),
    edge('e5', 'auth', 'log', { data: DEP }),
    edge('e6', 'http', 'log', { data: DEP }),
    edge('e7', 'http', 'config', { data: DEP }),
    edge('e8', 'ui', 'config', { data: DEP }),
    edge('e9', 'log', 'core', { data: DEP }),
    edge('e10', 'config', 'core', { data: DEP }),
    edge('e11', 'config', 'log', { label: 'cycle', sourceHandle: 'top', targetHandle: 'bottom', data: { kind: 'dependency', style: { arrow: true, lineStyle: 'dashed', stroke: '#ef4444' } } }),
  ],
)

const databaseSchema = doc(
  'Database schema',
  'Physical tables with SQL types, constraints, and indexes (IDX badge). Relationships attach to specific columns.',
  'database',
  'lr',
  [
    rec('users', 'database.table', 'users', 0, 0, [
      field('u-id', 'id', 'uuid', { key: 'primary', nullable: false }),
      field('u-email', 'email', 'citext NOT NULL', { key: 'unique', nullable: false, indexed: true }),
      field('u-name', 'display_name', 'varchar(120)', { nullable: true }),
      field('u-created', 'created_at', 'timestamptz DEFAULT now()', { nullable: false }),
    ], { icon: 'table' }),
    rec('orders', 'database.table', 'orders', 440, 0, [
      field('o-id', 'id', 'bigserial', { key: 'primary', nullable: false }),
      field('o-user', 'user_id', 'uuid REFERENCES users', { key: 'foreign', nullable: false, indexed: true }),
      field('o-status', 'status', "text CHECK (status IN ('new','paid'))", { nullable: false, indexed: true }),
      field('o-total', 'total_cents', 'bigint CHECK (total_cents >= 0)', { nullable: false }),
      field('o-placed', 'placed_at', 'timestamptz', { nullable: false, indexed: true }),
    ], { icon: 'table' }),
    rec('items', 'database.table', 'order_items', 880, 0, [
      field('i-id', 'id', 'bigserial', { key: 'primary', nullable: false }),
      field('i-order', 'order_id', 'bigint REFERENCES orders ON DELETE CASCADE', { key: 'foreign', nullable: false, indexed: true }),
      field('i-sku', 'sku', 'varchar(64)', { nullable: false, indexed: true }),
      field('i-qty', 'quantity', 'int CHECK (quantity > 0)', { nullable: false }),
    ], { icon: 'table' }),
  ],
  [
    edge('r1', 'users', 'orders', { sourceHandle: 'field:u-id:right', targetHandle: 'field:o-user:left', data: { kind: 'relationship', style: { arrow: false, pathType: 'step' }, sourceCardinality: 'one', targetCardinality: 'zero-many' } }),
    edge('r2', 'orders', 'items', { sourceHandle: 'field:o-id:right', targetHandle: 'field:i-order:left', data: { kind: 'relationship', style: { arrow: false, pathType: 'step' }, sourceCardinality: 'one', targetCardinality: 'many' } }),
  ],
)

// ───────────────────────── Data architecture ─────────────────────────

const medallion = doc(
  'Medallion',
  'Multi-tier data storage with rising quality: bronze raw, silver cleaned, gold business-ready. Jobs move data between tiers.',
  'infrastructure',
  'lr',
  [
    frame('bronze', 'infra.data-layer', 'Bronze', 300, 0, 300, 320, { params: { caption: 'raw' }, icon: 'database', style: { fillColor: '#fff7ed', borderColor: '#fdba74', borderStyle: 'solid' } }),
    frame('silver', 'infra.data-layer', 'Silver', 640, 0, 300, 320, { params: { caption: 'cleaned' }, icon: 'database', style: { fillColor: '#f8fafc', borderColor: '#cbd5e1', borderStyle: 'solid' } }),
    frame('gold', 'infra.data-layer', 'Gold', 980, 0, 300, 320, { params: { caption: 'curated' }, icon: 'database', style: { fillColor: '#fefce8', borderColor: '#fde047', borderStyle: 'solid' } }),
    res('src', 'infra.external', 'Source systems', 0, 100, { params: { resourceType: 'External' }, icon: 'globe' }),
    res('b1', 'infra.storage', 'events_raw', 340, 60, { params: { resourceType: 'Object storage' }, attributes: [attr('Format', 'JSON')], icon: 'folder' }),
    res('b2', 'infra.storage', 'crm_raw', 340, 190, { params: { resourceType: 'Object storage' }, attributes: [attr('Format', 'CSV')], icon: 'folder' }),
    res('s1', 'infra.storage', 'events_clean', 680, 60, { params: { resourceType: 'Object storage' }, attributes: [attr('Format', 'Delta')], icon: 'folder' }),
    res('s2', 'infra.storage', 'customers', 680, 190, { params: { resourceType: 'Object storage' }, attributes: [attr('Format', 'Delta')], icon: 'folder' }),
    res('g1', 'infra.storage', 'customer_360', 1020, 120, { params: { resourceType: 'Object storage' }, attributes: [attr('Format', 'Delta')], icon: 'star' }),
    res('bi', 'infra.client', 'BI & ML', 1340, 120, { params: { resourceType: 'Client' }, icon: 'activity' }),
  ],
  [
    edge('e1', 'src', 'b1', { label: 'ingest', data: DATA }),
    edge('e2', 'src', 'b2', { label: 'ingest', data: DATA }),
    edge('e3', 'b1', 's1', { label: 'dedupe, cast', data: DATA }),
    edge('e4', 'b2', 's2', { label: 'validate', data: DATA }),
    edge('e5', 's1', 'g1', { label: 'join', data: DATA }),
    edge('e6', 's2', 'g1', { label: 'join', data: DATA }),
    edge('e7', 'g1', 'bi', { label: 'serve', data: NET }),
  ],
)

const dpIntegration = doc(
  'DP integration',
  'Integration topology of a data platform: what feeds it, what it feeds, and the protocol on every link.',
  'infrastructure',
  'lr',
  [
    frame('platform', 'infra.network-zone', 'Data platform', 340, -40, 640, 420, { icon: 'layers' }),
    res('erp', 'infra.external', 'ERP', 0, 0, { params: { resourceType: 'External' }, icon: 'clipboard' }),
    res('crm', 'infra.external', 'CRM', 0, 150, { params: { resourceType: 'External' }, icon: 'users' }),
    res('web', 'infra.external', 'Web analytics', 0, 300, { params: { resourceType: 'External' }, icon: 'globe' }),
    res('ingest', 'infra.service', 'Ingestion', 380, 150, { params: { resourceType: 'Service', status: 'Healthy' }, icon: 'download' }),
    res('warehouse', 'infra.database-server', 'Warehouse', 700, 40, { params: { resourceType: 'Database Server', status: 'Healthy' }, icon: 'database' }),
    res('catalog', 'infra.service', 'Catalog & governance', 700, 240, { params: { resourceType: 'Service', status: 'Healthy' }, icon: 'bookmark' }),
    res('bi', 'infra.client', 'BI tool', 1040, 40, { params: { resourceType: 'Client' }, icon: 'activity' }),
    res('reverse', 'infra.external', 'Marketing automation', 1040, 240, { params: { resourceType: 'External' }, icon: 'send' }),
  ],
  [
    edge('e1', 'erp', 'ingest', { label: 'JDBC nightly', data: NET }),
    edge('e2', 'crm', 'ingest', { label: 'REST hourly', data: NET }),
    edge('e3', 'web', 'ingest', { label: 'Kafka stream', data: NET }),
    edge('e4', 'ingest', 'warehouse', { label: 'COPY', data: DATA }),
    edge('e5', 'warehouse', 'catalog', { label: 'metadata', sourceHandle: 'bottom', targetHandle: 'top', data: { kind: 'data', style: { arrow: true, arrowStart: true, pathType: 'step' } } }),
    edge('e6', 'warehouse', 'bi', { label: 'SQL', data: NET }),
    edge('e7', 'warehouse', 'reverse', { label: 'reverse ETL', data: NET }),
  ],
)

const entry = (id: string, category: string, source: WorkflowDoc): WorkflowTemplate => ({
  id,
  name: source.settings.name,
  description: source.settings.description ?? '',
  category,
  doc: source,
})

export const diagramTypeTemplates: WorkflowTemplate[] = [
  entry('type-architecture', 'Structure', architecture),
  entry('type-it-current-state', 'Structure', itCurrentState),
  entry('type-flowchart', 'Structure', flowchart),
  entry('type-state-machine', 'Structure', stateMachine),
  entry('type-swimlane', 'Structure', swimlane),
  entry('type-nested', 'Hierarchy', nested),
  entry('type-tree', 'Hierarchy', tree),
  entry('type-layer-stack', 'Hierarchy', layerStack),
  entry('type-uml-class', 'Hierarchy', umlClass),
  entry('type-story-map', 'Hierarchy', storyMap),
  entry('type-loop', 'Flow & process', loop),
  entry('type-high-level', 'Flow & process', highLevel),
  entry('type-process', 'Flow & process', process),
  entry('type-data-flow', 'Flow & process', dataFlow),
  entry('type-kanban', 'Flow & process', kanban),
  entry('type-deployment', 'Flow & process', deployment),
  entry('type-dependency-graph', 'Flow & process', dependencyGraph),
  entry('type-database-schema', 'Flow & process', databaseSchema),
  entry('type-medallion', 'Data architecture', medallion),
  entry('type-dp-integration', 'Data architecture', dpIntegration),
]
