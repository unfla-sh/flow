import {
  Building2,
  CircleCheck,
  CirclePlay,
  ClipboardList,
  Database,
  Diamond,
  FileCode2,
  Frame,
  GitBranch,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Network,
  Router,
  Repeat,
  Shuffle,
  Split,
  Server,
  Shield,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Table2,
  Timer,
  TriangleAlert,
  Trophy,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import type {
  DiagramKind,
  NodeTypeId,
  WorkflowDoc,
  WorkflowNodeData,
} from '@/types/workflow'

export type NodeCategory =
  | 'Core'
  | 'Data'
  | 'Forms & UI'
  | 'Controls'
  | 'Organisation'
  | 'Database'
  | 'Infrastructure'
  | 'Image Generation'
  | 'Annotate'

export interface NodeCatalogEntry {
  /** Unique palette id; several entries can share the same canvas nodeType. */
  id: string
  nodeType: NodeTypeId
  label: string
  description: string
  category: NodeCategory
  /** Diagram kits where this definition appears. Omitted entries are workflow/general. */
  kits?: DiagramKind[]
  icon: LucideIcon
  defaultData: () => WorkflowNodeData
}

export const NODE_CATEGORIES: NodeCategory[] = [
  'Core',
  'Data',
  'Forms & UI',
  'Controls',
  'Organisation',
  'Database',
  'Infrastructure',
  'Image Generation',
  'Annotate',
]

export const nodeCatalog: NodeCatalogEntry[] = [
  {
    id: 'script',
    nodeType: 'script',
    label: 'Script Executor',
    description: 'Runs a Python script (e.g. 1.py) with configurable arguments.',
    category: 'Core',
    icon: FileCode2,
    defaultData: () => ({
      label: 'Script Executor',
      nodeType: 'script',
      params: { args: [] },
      scriptPath: '1.py',
    }),
  },
  {
    id: 'subflow',
    nodeType: 'subflow',
    label: 'Sub-Flow',
    description: 'Container for a nested workflow. Drill-down arrives in a later phase.',
    category: 'Core',
    icon: Layers,
    defaultData: () => ({
      label: 'Sub-Flow',
      nodeType: 'subflow',
      params: {},
    }),
  },
  {
    id: 'fetch',
    nodeType: 'data',
    label: 'Fetch / API',
    description: 'Calls an HTTP endpoint and exposes the response as simulated output.',
    category: 'Data',
    icon: Globe,
    defaultData: () => ({
      label: 'Fetch / API',
      nodeType: 'data',
      params: { method: 'GET', url: '' },
      simulatedOutput: { status: 200, data: [] },
    }),
  },
  {
    id: 'transform',
    nodeType: 'data',
    label: 'Data Transform',
    description: 'Maps or reshapes incoming data before passing it downstream.',
    category: 'Data',
    icon: Shuffle,
    defaultData: () => ({
      label: 'Data Transform',
      nodeType: 'data',
      params: { expression: '' },
    }),
  },
  {
    id: 'output',
    nodeType: 'data',
    label: 'Output Viewer',
    description: 'Displays the simulated JSON / table output of the connected node.',
    category: 'Data',
    icon: Table2,
    defaultData: () => ({
      label: 'Output Viewer',
      nodeType: 'data',
      params: {},
    }),
  },
  {
    id: 'form',
    nodeType: 'form',
    label: 'Form Node',
    description:
      'Rich form with calendar pickers, selects and inputs, edited in the properties panel.',
    category: 'Forms & UI',
    icon: ClipboardList,
    defaultData: () => ({
      label: 'Form Node',
      nodeType: 'form',
      params: {},
      formSchema: [
        {
          id: crypto.randomUUID(),
          label: 'Title',
          type: 'text',
          required: true,
        },
      ],
    }),
  },
  {
    id: 'condition',
    nodeType: 'condition',
    label: 'Condition / Decision',
    description: 'Branches the flow into true / false paths based on an expression.',
    category: 'Forms & UI',
    icon: GitBranch,
    defaultData: () => ({
      label: 'Condition',
      nodeType: 'condition',
      params: { expression: '' },
    }),
  },
  {
    id: 'switch',
    nodeType: 'switch',
    label: 'Switch / Case',
    description: 'Multi-way branch: one output per case-when value, plus a default output.',
    category: 'Forms & UI',
    icon: Split,
    defaultData: () => ({
      label: 'Switch',
      nodeType: 'switch',
      params: { expression: 'status' },
      cases: [
        { id: crypto.randomUUID(), when: "'approved'" },
        { id: crypto.randomUUID(), when: "'rejected'" },
      ],
    }),
  },
  {
    id: 'start',
    nodeType: 'start',
    label: 'Start',
    description: 'Entry point of the workflow.',
    category: 'Controls',
    icon: CirclePlay,
    defaultData: () => ({
      label: 'Start',
      nodeType: 'start',
      params: {},
    }),
  },
  {
    id: 'end',
    nodeType: 'end',
    label: 'End',
    description: 'Terminal point of the workflow.',
    category: 'Controls',
    icon: CircleCheck,
    defaultData: () => ({
      label: 'End',
      nodeType: 'end',
      params: {},
    }),
  },
  {
    id: 'loop',
    nodeType: 'condition',
    label: 'Loop',
    description: 'Repeat a branch while a condition holds; the true path is the loop body.',
    category: 'Controls',
    icon: Repeat,
    defaultData: () => ({
      label: 'Loop',
      nodeType: 'condition',
      params: { expression: 'i < items.length' },
      icon: 'repeat',
    }),
  },
  {
    id: 'delay',
    nodeType: 'script',
    label: 'Delay / Timer',
    description: 'Pause the flow for a fixed duration before continuing.',
    category: 'Controls',
    icon: Timer,
    defaultData: () => ({
      label: 'Delay',
      nodeType: 'script',
      params: { args: [{ id: crypto.randomUUID(), key: 'duration', value: '5s' }] },
      icon: 'timer',
    }),
  },
  {
    id: 'error_handler',
    nodeType: 'condition',
    label: 'Error Handler',
    description: 'Branch on failure: the true path handles errors, the false path is the happy path.',
    category: 'Controls',
    icon: TriangleAlert,
    defaultData: () => ({
      label: 'Error Handler',
      nodeType: 'condition',
      params: { expression: 'on error' },
      icon: 'alert',
    }),
  },
  {
    id: 'decision',
    nodeType: 'decision',
    label: 'Decision',
    description: 'Flowchart diamond with true / false exits.',
    category: 'Controls',
    icon: Diamond,
    defaultData: () => ({
      label: 'Decision',
      nodeType: 'decision',
      params: { expression: '' },
    }),
  },
  {
    id: 'org.person',
    nodeType: 'profile',
    label: 'Person',
    description: 'Employee or stakeholder with role, department, status, and contact details.',
    category: 'Organisation',
    kits: ['organization', 'general'],
    icon: UserRound,
    defaultData: () => ({
      label: 'Person name',
      nodeType: 'profile',
      params: { title: 'Role title', department: 'Department', status: 'Active' },
      attributes: [
        { id: crypto.randomUUID(), label: 'Email', value: '' },
        { id: crypto.randomUUID(), label: 'Location', value: '' },
      ],
      icon: 'user',
    }),
  },
  {
    id: 'org.vacant-role',
    nodeType: 'profile',
    label: 'Vacant Role',
    description: 'Unfilled position in the reporting structure.',
    category: 'Organisation',
    kits: ['organization'],
    icon: UserRound,
    defaultData: () => ({
      label: 'Vacant role',
      nodeType: 'profile',
      params: { title: 'Position title', department: 'Department', status: 'Vacant' },
      attributes: [],
      icon: 'user',
      style: { borderStyle: 'dashed', fillColor: '#f8fafc' },
    }),
  },
  {
    id: 'org.team',
    nodeType: 'resource',
    label: 'Team',
    description: 'Team, committee, or working group.',
    category: 'Organisation',
    kits: ['organization', 'general'],
    icon: UsersRound,
    defaultData: () => ({
      label: 'Team name',
      nodeType: 'resource',
      params: { resourceType: 'Team', environment: '', status: '' },
      attributes: [{ id: crypto.randomUUID(), label: 'Owner', value: '' }],
      icon: 'users',
    }),
  },
  {
    id: 'org.department',
    nodeType: 'frame',
    label: 'Department',
    description: 'Resizable visual boundary for an organisation department.',
    category: 'Organisation',
    kits: ['organization'],
    icon: Building2,
    defaultData: () => ({
      label: 'Department',
      nodeType: 'frame',
      params: {},
      icon: 'building',
      style: { borderStyle: 'dashed', fillColor: '#f8fafc' },
    }),
  },
  {
    id: 'database.table',
    nodeType: 'record',
    label: 'Database Table',
    description: 'Entity table with typed fields and row-level relationship handles.',
    category: 'Database',
    kits: ['database', 'general'],
    icon: Table2,
    defaultData: () => ({
      label: 'table_name',
      nodeType: 'record',
      params: { recordKind: 'Table', namespace: 'public' },
      fields: [
        { id: crypto.randomUUID(), name: 'id', dataType: 'uuid', key: 'primary', nullable: false },
        { id: crypto.randomUUID(), name: 'created_at', dataType: 'timestamp', key: 'none', nullable: false },
      ],
      icon: 'table',
    }),
  },
  {
    id: 'database.view',
    nodeType: 'record',
    label: 'Database View',
    description: 'Read model or derived database view.',
    category: 'Database',
    kits: ['database'],
    icon: Table2,
    defaultData: () => ({
      label: 'view_name',
      nodeType: 'record',
      params: { recordKind: 'View', namespace: 'public' },
      fields: [{ id: crypto.randomUUID(), name: 'field', dataType: 'text', key: 'none' }],
      icon: 'eye',
      style: { borderStyle: 'dashed' },
    }),
  },
  {
    id: 'infra.firewall',
    nodeType: 'resource',
    label: 'Firewall',
    description: 'Network security boundary or filtering appliance.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: Shield,
    defaultData: () => ({
      label: 'Firewall',
      nodeType: 'resource',
      params: { resourceType: 'Firewall', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: crypto.randomUUID(), label: 'Policy', value: 'Allow HTTPS' }],
      icon: 'lock',
      style: { iconBg: '#fee2e2', borderColor: '#ef4444' },
    }),
  },
  {
    id: 'infra.load-balancer',
    nodeType: 'resource',
    label: 'Load Balancer',
    description: 'Traffic distributor with protocol, endpoint, and health metadata.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Network,
    defaultData: () => ({
      label: 'Load Balancer',
      nodeType: 'resource',
      params: { resourceType: 'Load Balancer', environment: 'Production', status: 'Healthy' },
      attributes: [
        { id: crypto.randomUUID(), label: 'Endpoint', value: '' },
        { id: crypto.randomUUID(), label: 'Protocol', value: 'HTTPS' },
      ],
      icon: 'network',
    }),
  },
  {
    id: 'infra.web-server',
    nodeType: 'resource',
    label: 'Web Server',
    description: 'Public-facing or internal HTTP server.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Server,
    defaultData: () => ({
      label: 'Web Server',
      nodeType: 'resource',
      params: { resourceType: 'Web Server', environment: 'Production', status: 'Healthy' },
      attributes: [
        { id: crypto.randomUUID(), label: 'Host', value: '' },
        { id: crypto.randomUUID(), label: 'Port', value: '443' },
      ],
      icon: 'server',
    }),
  },
  {
    id: 'infra.app-server',
    nodeType: 'resource',
    label: 'Application Server',
    description: 'Application service or compute instance.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Server,
    defaultData: () => ({
      label: 'Application Server',
      nodeType: 'resource',
      params: { resourceType: 'Application Server', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: crypto.randomUUID(), label: 'Runtime', value: '' }],
      icon: 'cpu',
    }),
  },
  {
    id: 'infra.database-server',
    nodeType: 'resource',
    label: 'Database Server',
    description: 'Relational or document database service.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Database,
    defaultData: () => ({
      label: 'Database',
      nodeType: 'resource',
      params: { resourceType: 'Database', environment: 'Production', status: 'Healthy' },
      attributes: [
        { id: crypto.randomUUID(), label: 'Engine', value: 'PostgreSQL' },
        { id: crypto.randomUUID(), label: 'Port', value: '5432' },
      ],
      icon: 'database',
      style: { iconBg: '#dcfce7', borderColor: '#22c55e' },
    }),
  },
  {
    id: 'infra.cache',
    nodeType: 'resource',
    label: 'Cache',
    description: 'Shared in-memory cache or key-value store.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Router,
    defaultData: () => ({
      label: 'Cache',
      nodeType: 'resource',
      params: { resourceType: 'Cache', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: crypto.randomUUID(), label: 'Engine', value: 'Redis' }],
      icon: 'zap',
    }),
  },
  {
    id: 'infra.network-zone',
    nodeType: 'frame',
    label: 'Network Zone',
    description: 'Resizable boundary for a VPC, subnet, DMZ, region, or cluster.',
    category: 'Infrastructure',
    kits: ['infrastructure'],
    icon: Network,
    defaultData: () => ({
      label: 'Network Zone',
      nodeType: 'frame',
      params: {},
      icon: 'cloud',
      style: { borderStyle: 'dashed', fillColor: '#f0f9ff', borderColor: '#38bdf8' },
    }),
  },
  {
    id: 'image.prompt',
    nodeType: 'data',
    label: 'Prompt',
    description: 'Positive or negative text prompt supplied to a generation model.',
    category: 'Image Generation',
    kits: ['image-generation'],
    icon: Sparkles,
    defaultData: () => ({
      label: 'Prompt',
      nodeType: 'data',
      params: { prompt: '', negativePrompt: '' },
      description: 'Text conditioning for the image model',
      icon: 'sparkles',
    }),
  },
  {
    id: 'image.model',
    nodeType: 'resource',
    label: 'Image Model',
    description: 'Generation model or checkpoint.',
    category: 'Image Generation',
    kits: ['image-generation'],
    icon: ImagePlus,
    defaultData: () => ({
      label: 'Image Model',
      nodeType: 'resource',
      params: { resourceType: 'Model', environment: '', status: 'Ready' },
      attributes: [{ id: crypto.randomUUID(), label: 'Checkpoint', value: '' }],
      icon: 'brain',
    }),
  },
  {
    id: 'image.sampler',
    nodeType: 'resource',
    label: 'Sampler',
    description: 'Sampling algorithm and generation parameters.',
    category: 'Image Generation',
    kits: ['image-generation'],
    icon: SlidersHorizontal,
    defaultData: () => ({
      label: 'Sampler',
      nodeType: 'resource',
      params: { resourceType: 'Sampler', environment: '', status: '' },
      attributes: [
        { id: crypto.randomUUID(), label: 'Steps', value: '30' },
        { id: crypto.randomUUID(), label: 'Seed', value: 'Random' },
        { id: crypto.randomUUID(), label: 'Size', value: '1024x1024' },
      ],
      icon: 'settings',
    }),
  },
  {
    id: 'image.upscaler',
    nodeType: 'resource',
    label: 'Upscaler',
    description: 'Image refinement or resolution enhancement step.',
    category: 'Image Generation',
    kits: ['image-generation'],
    icon: ImagePlus,
    defaultData: () => ({
      label: 'Upscaler',
      nodeType: 'resource',
      params: { resourceType: 'Upscaler', environment: '', status: '' },
      attributes: [{ id: crypto.randomUUID(), label: 'Scale', value: '2x' }],
      icon: 'image',
    }),
  },
  {
    id: 'note',
    nodeType: 'note',
    label: 'Note',
    description: 'Sticky annotation for documenting your workflow.',
    category: 'Annotate',
    icon: StickyNote,
    defaultData: () => ({
      label: 'Note',
      nodeType: 'note',
      params: { text: 'Double-click to edit in the panel' },
    }),
  },
  {
    id: 'frame',
    nodeType: 'frame',
    label: 'Frame',
    description: 'Visual grouping box to organise nodes on the canvas.',
    category: 'Annotate',
    icon: Frame,
    defaultData: () => ({
      label: 'Group',
      nodeType: 'frame',
      params: {},
      style: { borderStyle: 'dashed' },
    }),
  },
  {
    id: 'scorecard',
    nodeType: 'scorecard',
    label: 'Score Card',
    description:
      'Results card: header strip plus rows of label + value, bold rows emphasised. For brackets, leaderboards, comparisons.',
    category: 'Annotate',
    icon: Trophy,
    defaultData: () => ({
      label: 'Score Card',
      nodeType: 'scorecard',
      params: {
        header: 'Header',
        tag: '',
        rows: [
          { icon: '', label: 'Entry A', value: '0', bold: true },
          { icon: '', label: 'Entry B', value: '0' },
        ],
      },
    }),
  },
  {
    id: 'media',
    nodeType: 'media',
    label: 'Media Preview',
    description: 'Inline image, audio, or video preview node.',
    category: 'Annotate',
    icon: ImageIcon,
    defaultData: () => ({
      label: 'Media Preview',
      nodeType: 'media',
      params: { url: '', kind: 'image' },
    }),
  },
]

export function getCatalogEntry(id: string): NodeCatalogEntry | undefined {
  return nodeCatalog.find((entry) => entry.id === id)
}

export function getCatalogEntryByNodeType(nodeType: NodeTypeId): NodeCatalogEntry | undefined {
  return nodeCatalog.find((entry) => entry.nodeType === nodeType)
}

const UNIVERSAL_CATALOG_IDS = new Set(['note', 'frame', 'media'])

export function catalogEntriesForKit(kind: DiagramKind): NodeCatalogEntry[] {
  return nodeCatalog.filter((entry) => {
    if (kind === 'general') return true
    if (UNIVERSAL_CATALOG_IDS.has(entry.id)) return true
    if (entry.kits) return entry.kits.includes(kind)
    return kind === 'workflow'
  })
}

/** Infer a stable catalog definition for legacy/generated nodes that only stored a renderer type. */
export function inferCatalogDefinitionId(
  data: WorkflowNodeData,
  diagramKind: DiagramKind = 'workflow',
): string {
  if (data.definitionId) return data.definitionId

  if (data.nodeType === 'script') {
    return data.icon === 'timer' || 'duration' in data.params ? 'delay' : 'script'
  }
  if (data.nodeType === 'condition') {
    if (data.icon === 'repeat') return 'loop'
    if (data.icon === 'alert') return 'error_handler'
    return 'condition'
  }
  if (data.nodeType === 'data') {
    if (diagramKind === 'image-generation' || 'prompt' in data.params) return 'image.prompt'
    if ('url' in data.params || 'method' in data.params) return 'fetch'
    if ('expression' in data.params) return 'transform'
    if (/output|viewer/i.test(data.label)) return 'output'
    return 'transform'
  }
  if (data.nodeType === 'profile') {
    return /vacant|open/i.test(String(data.params.status ?? ''))
      ? 'org.vacant-role'
      : 'org.person'
  }
  if (data.nodeType === 'record') {
    return String(data.params.recordKind ?? '').toLowerCase() === 'view'
      ? 'database.view'
      : 'database.table'
  }
  if (data.nodeType === 'resource') {
    const resourceType = String(data.params.resourceType ?? '').toLowerCase()
    if (resourceType.includes('firewall')) return 'infra.firewall'
    if (resourceType.includes('load balancer')) return 'infra.load-balancer'
    if (resourceType.includes('database')) return 'infra.database-server'
    if (resourceType.includes('cache')) return 'infra.cache'
    if (resourceType.includes('application')) return 'infra.app-server'
    if (resourceType.includes('web server')) return 'infra.web-server'
    if (resourceType.includes('sampler')) return 'image.sampler'
    if (resourceType.includes('upscaler')) return 'image.upscaler'
    if (resourceType.includes('model')) return 'image.model'
    return diagramKind === 'organization' ? 'org.team' : 'infra.app-server'
  }
  if (data.nodeType === 'frame') {
    if (diagramKind === 'organization') return 'org.department'
    if (diagramKind === 'infrastructure') return 'infra.network-zone'
  }
  return getCatalogEntryByNodeType(data.nodeType)?.id ?? data.nodeType
}

/** Add stable definition ids without mutating the source document. */
export function normalizeCatalogDefinitionIds(doc: WorkflowDoc): WorkflowDoc {
  const diagramKind = doc.settings.diagramKind ?? 'workflow'
  return {
    ...doc,
    flows: Object.fromEntries(
      Object.entries(doc.flows).map(([flowId, graph]) => [
        flowId,
        {
          ...graph,
          nodes: graph.nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              definitionId: inferCatalogDefinitionId(node.data, diagramKind),
            },
          })),
        },
      ]),
    ),
  }
}
