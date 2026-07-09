import {
  CircleCheck,
  CirclePlay,
  ClipboardList,
  Diamond,
  FileCode2,
  Frame,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Layers,
  Repeat,
  Shuffle,
  Split,
  StickyNote,
  Table2,
  Timer,
  TriangleAlert,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import type { NodeTypeId, WorkflowNodeData } from '@/types/workflow'

export type NodeCategory = 'Core' | 'Data' | 'Forms & UI' | 'Controls' | 'Annotate'

export interface NodeCatalogEntry {
  /** Unique palette id; several entries can share the same canvas nodeType. */
  id: string
  nodeType: NodeTypeId
  label: string
  description: string
  category: NodeCategory
  icon: LucideIcon
  defaultData: () => WorkflowNodeData
}

export const NODE_CATEGORIES: NodeCategory[] = [
  'Core',
  'Data',
  'Forms & UI',
  'Controls',
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
