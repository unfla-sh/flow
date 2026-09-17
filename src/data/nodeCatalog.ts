import {
  ArrowRightLeft,
  Blocks,
  Boxes,
  Braces,
  Building2,
  CircleCheck,
  CircleDot,
  Cloud,
  Columns3,
  Component,
  Container,
  HardDrive,
  Kanban,
  ListChecks,
  MessageSquare,
  Milestone,
  MonitorSmartphone,
  Rocket,
  SquareStack,
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

import { newId } from '@/lib/ids'
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
  | 'State'
  | 'Planning'
  | 'UML'
  | 'General'
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
  'State',
  'Planning',
  'UML',
  'General',
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
          id: newId(),
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
        { id: newId(), when: "'approved'" },
        { id: newId(), when: "'rejected'" },
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
      params: { args: [{ id: newId(), key: 'duration', value: '5s' }] },
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
        { id: newId(), label: 'Email', value: '' },
        { id: newId(), label: 'Location', value: '' },
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
      attributes: [{ id: newId(), label: 'Owner', value: '' }],
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
        { id: newId(), name: 'id', dataType: 'uuid', key: 'primary', nullable: false },
        { id: newId(), name: 'created_at', dataType: 'timestamp', key: 'none', nullable: false },
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
      fields: [{ id: newId(), name: 'field', dataType: 'text', key: 'none' }],
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
      attributes: [{ id: newId(), label: 'Policy', value: 'Allow HTTPS' }],
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
        { id: newId(), label: 'Endpoint', value: '' },
        { id: newId(), label: 'Protocol', value: 'HTTPS' },
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
        { id: newId(), label: 'Host', value: '' },
        { id: newId(), label: 'Port', value: '443' },
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
      attributes: [{ id: newId(), label: 'Runtime', value: '' }],
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
        { id: newId(), label: 'Engine', value: 'PostgreSQL' },
        { id: newId(), label: 'Port', value: '5432' },
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
      attributes: [{ id: newId(), label: 'Engine', value: 'Redis' }],
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
      attributes: [{ id: newId(), label: 'Checkpoint', value: '' }],
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
        { id: newId(), label: 'Steps', value: '30' },
        { id: newId(), label: 'Seed', value: 'Random' },
        { id: newId(), label: 'Size', value: '1024x1024' },
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
      attributes: [{ id: newId(), label: 'Scale', value: '2x' }],
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

  // ── General building blocks (architecture, trees, nesting, layers, dependency graphs) ──
  {
    id: 'general.component',
    nodeType: 'resource',
    label: 'Component',
    description: 'Plain box for a component, module, service, or any labelled thing.',
    category: 'General',
    kits: ['general', 'workflow', 'infrastructure', 'state', 'planning', 'uml'],
    icon: Component,
    defaultData: () => ({
      label: 'Component',
      nodeType: 'resource',
      params: {},
      attributes: [],
      icon: 'box',
    }),
  },
  {
    id: 'general.layer',
    nodeType: 'frame',
    label: 'Layer band',
    description: 'Wide solid band for a layer stack or tier; put components inside it.',
    category: 'General',
    kits: ['general', 'infrastructure', 'workflow'],
    icon: SquareStack,
    defaultData: () => ({
      label: 'Layer',
      nodeType: 'frame',
      params: { caption: '' },
      icon: 'layers',
      style: { borderStyle: 'solid', fillColor: '#f8fafc', borderColor: '#cbd5e1' },
    }),
  },
  {
    id: 'process.lane',
    nodeType: 'frame',
    label: 'Swimlane',
    description: 'A lane for one actor or role in a cross-functional process.',
    category: 'Core',
    kits: ['workflow', 'general'],
    icon: Columns3,
    defaultData: () => ({
      label: 'Lane',
      nodeType: 'frame',
      params: { caption: '' },
      icon: 'user',
      style: { borderStyle: 'solid', fillColor: '#fafafa', borderColor: '#d4d4d8' },
    }),
  },

  // ── State machine ──
  {
    id: 'state.state',
    nodeType: 'resource',
    label: 'State',
    description: 'A state with optional entry/exit actions; transitions carry guards.',
    category: 'State',
    kits: ['state', 'general'],
    icon: CircleDot,
    defaultData: () => ({
      label: 'State',
      nodeType: 'resource',
      params: { resourceType: 'State' },
      attributes: [
        { id: newId(), label: 'entry', value: '' },
        { id: newId(), label: 'exit', value: '' },
      ],
      icon: 'play',
      style: { iconBg: '#ede9fe', borderColor: '#8b5cf6' },
    }),
  },
  {
    id: 'state.composite',
    nodeType: 'frame',
    label: 'Composite state',
    description: 'A state that contains sub-states; resize it around them.',
    category: 'State',
    kits: ['state', 'general'],
    icon: Boxes,
    defaultData: () => ({
      label: 'Composite state',
      nodeType: 'frame',
      params: { caption: '' },
      icon: 'layers',
      style: { borderStyle: 'solid', fillColor: '#f5f3ff', borderColor: '#a78bfa' },
    }),
  },

  // ── Planning: kanban and story maps ──
  {
    id: 'plan.column',
    nodeType: 'frame',
    label: 'Kanban column',
    description: 'A work state (To do, Doing, Done) with an optional WIP limit.',
    category: 'Planning',
    kits: ['planning', 'general'],
    icon: Kanban,
    defaultData: () => ({
      label: 'To do',
      nodeType: 'frame',
      params: { caption: 'WIP 3' },
      icon: 'clipboard',
      style: { borderStyle: 'solid', fillColor: '#f8fafc', borderColor: '#cbd5e1' },
    }),
  },
  {
    id: 'plan.card',
    nodeType: 'resource',
    label: 'Work item',
    description: 'A card with owner, size, and status.',
    category: 'Planning',
    kits: ['planning', 'general'],
    icon: ListChecks,
    defaultData: () => ({
      label: 'Work item',
      nodeType: 'resource',
      params: { resourceType: 'Story', status: 'Ready' },
      attributes: [
        { id: newId(), label: 'Owner', value: '' },
        { id: newId(), label: 'Size', value: '3' },
      ],
      icon: 'check',
    }),
  },
  {
    id: 'plan.activity',
    nodeType: 'resource',
    label: 'Activity / epic',
    description: 'Backbone step of a story map; user tasks hang beneath it.',
    category: 'Planning',
    kits: ['planning', 'general'],
    icon: Milestone,
    defaultData: () => ({
      label: 'Activity',
      nodeType: 'resource',
      params: { resourceType: 'Activity' },
      attributes: [],
      icon: 'flag',
      style: { iconBg: '#fef3c7', borderColor: '#f59e0b' },
    }),
  },
  {
    id: 'plan.release',
    nodeType: 'frame',
    label: 'Release slice',
    description: 'Horizontal band grouping the tasks that ship together.',
    category: 'Planning',
    kits: ['planning', 'general'],
    icon: Rocket,
    defaultData: () => ({
      label: 'Release 1',
      nodeType: 'frame',
      params: { caption: '' },
      icon: 'rocket',
      style: { borderStyle: 'dashed', fillColor: '#f0fdf4', borderColor: '#86efac' },
    }),
  },

  // ── UML class ──
  {
    id: 'uml.class',
    nodeType: 'record',
    label: 'Class',
    description: 'Attributes and operations; connect with inheritance, composition, or association.',
    category: 'UML',
    kits: ['uml', 'general'],
    icon: Braces,
    defaultData: () => ({
      label: 'ClassName',
      nodeType: 'record',
      params: { recordKind: 'Class', namespace: '' },
      fields: [{ id: newId(), name: '- id', dataType: 'UUID', key: 'none' }],
      operations: [{ id: newId(), signature: '+ describe(): string' }],
      icon: 'code-tags',
    }),
  },
  {
    id: 'uml.interface',
    nodeType: 'record',
    label: 'Interface',
    description: 'Operations only; classes realise it with a dotted open-triangle edge.',
    category: 'UML',
    kits: ['uml', 'general'],
    icon: Blocks,
    defaultData: () => ({
      label: 'InterfaceName',
      nodeType: 'record',
      params: { recordKind: 'Interface', namespace: '«interface»' },
      fields: [],
      operations: [{ id: newId(), signature: '+ execute(): void' }],
      icon: 'code-tags',
      style: { borderStyle: 'dashed' },
    }),
  },
  {
    id: 'uml.enum',
    nodeType: 'record',
    label: 'Enum',
    description: 'A fixed set of values.',
    category: 'UML',
    kits: ['uml', 'general'],
    icon: ListChecks,
    defaultData: () => ({
      label: 'EnumName',
      nodeType: 'record',
      params: { recordKind: 'Enum', namespace: '«enumeration»' },
      fields: [
        { id: newId(), name: 'ACTIVE', dataType: '', key: 'none' },
        { id: newId(), name: 'INACTIVE', dataType: '', key: 'none' },
      ],
      operations: [],
      icon: 'tag',
    }),
  },

  // ── Architecture / deployment (infrastructure kit) ──
  {
    id: 'infra.service',
    nodeType: 'resource',
    label: 'Service / API',
    description: 'A deployable service, API, or worker.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: Cloud,
    defaultData: () => ({
      label: 'Service',
      nodeType: 'resource',
      params: { resourceType: 'Service', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: newId(), label: 'Port', value: '8080' }],
      icon: 'cloud',
    }),
  },
  {
    id: 'infra.queue',
    nodeType: 'resource',
    label: 'Queue / topic',
    description: 'Message queue, topic, or event stream.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: MessageSquare,
    defaultData: () => ({
      label: 'Queue',
      nodeType: 'resource',
      params: { resourceType: 'Queue', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: newId(), label: 'Topic', value: '' }],
      icon: 'message',
      style: { iconBg: '#fef3c7' },
    }),
  },
  {
    id: 'infra.storage',
    nodeType: 'resource',
    label: 'Object storage',
    description: 'Bucket, file share, or data lake zone.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: HardDrive,
    defaultData: () => ({
      label: 'Storage',
      nodeType: 'resource',
      params: { resourceType: 'Object storage', environment: 'Production', status: 'Healthy' },
      attributes: [{ id: newId(), label: 'Bucket', value: '' }],
      icon: 'folder',
    }),
  },
  {
    id: 'infra.client',
    nodeType: 'resource',
    label: 'Client',
    description: 'Browser, mobile app, or other consumer of the system.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: MonitorSmartphone,
    defaultData: () => ({
      label: 'Client',
      nodeType: 'resource',
      params: { resourceType: 'Client' },
      attributes: [],
      icon: 'user',
    }),
  },
  {
    id: 'infra.external',
    nodeType: 'resource',
    label: 'External system',
    description: 'Third-party or legacy system outside your control.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: ArrowRightLeft,
    defaultData: () => ({
      label: 'External system',
      nodeType: 'resource',
      params: { resourceType: 'External' },
      attributes: [],
      icon: 'globe',
      style: { borderStyle: 'dashed' },
    }),
  },
  {
    id: 'infra.host',
    nodeType: 'frame',
    label: 'Host / node',
    description: 'VM, Kubernetes node, or physical host; artifacts run inside it.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: Container,
    defaultData: () => ({
      label: 'Host',
      nodeType: 'frame',
      params: { caption: '' },
      icon: 'server',
      style: { borderStyle: 'solid', fillColor: '#f8fafc', borderColor: '#94a3b8' },
    }),
  },
  {
    id: 'infra.data-layer',
    nodeType: 'frame',
    label: 'Data layer',
    description: 'Medallion tier (bronze, silver, gold) or any data platform zone.',
    category: 'Infrastructure',
    kits: ['infrastructure', 'general'],
    icon: SquareStack,
    defaultData: () => ({
      label: 'Bronze',
      nodeType: 'frame',
      params: { caption: 'raw' },
      icon: 'database',
      style: { borderStyle: 'solid', fillColor: '#fff7ed', borderColor: '#fdba74' },
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
/** Workflow-only definitions that a state machine also needs (initial/final/choice). */
const STATE_SHARED_IDS = new Set(['start', 'end', 'decision'])

export function catalogEntriesForKit(kind: DiagramKind): NodeCatalogEntry[] {
  return nodeCatalog.filter((entry) => {
    if (kind === 'general') return true
    if (UNIVERSAL_CATALOG_IDS.has(entry.id)) return true
    if (kind === 'state' && STATE_SHARED_IDS.has(entry.id)) return true
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
    const recordKind = String(data.params.recordKind ?? '').toLowerCase()
    if (recordKind === 'view') return 'database.view'
    if (recordKind === 'class') return 'uml.class'
    if (recordKind === 'interface') return 'uml.interface'
    if (recordKind === 'enum') return 'uml.enum'
    return 'database.table'
  }
  if (data.nodeType === 'resource') {
    const resourceType = String(data.params.resourceType ?? '').toLowerCase()
    if (resourceType === 'state') return 'state.state'
    if (resourceType === 'story' || resourceType === 'task') return 'plan.card'
    if (resourceType === 'activity') return 'plan.activity'
    if (resourceType === 'queue') return 'infra.queue'
    if (resourceType.includes('storage')) return 'infra.storage'
    if (resourceType === 'client') return 'infra.client'
    if (resourceType === 'external') return 'infra.external'
    if (resourceType === 'service') return 'infra.service'
    if (!resourceType && diagramKind !== 'organization') return 'general.component'
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
    if (diagramKind === 'state') return 'state.composite'
    if (diagramKind === 'planning') return 'plan.column'
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
