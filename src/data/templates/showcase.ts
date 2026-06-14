import { SWITCH_DEFAULT_HANDLE, type WorkflowDoc } from '@/types/workflow'

import type { WorkflowTemplate } from './types'

/**
 * Safe, generic "feature tour" templates. Split into three small flows so each
 * stays readable while collectively demonstrating every node type and feature.
 * No proprietary data — fine to publish.
 */

// 1 ─ Basics: start/end, form (with fields), script (args + snippet),
//     condition branching, note, frame grouping.
const basics: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Tour 1 · Basics & Forms',
    version: '1.0.0',
    description: 'Start → form → script → condition → end. Shows forms, scripts, branching, notes and frames.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 180 }, data: { label: 'Start', nodeType: 'start', params: {} } },
        {
          id: 'form',
          type: 'form',
          position: { x: 200, y: 120 },
          data: {
            label: 'Request form',
            description: 'Edit fields in the Form tab →',
            nodeType: 'form',
            params: {},
            formSchema: [
              { id: 'f1', label: 'Title', type: 'text', required: true },
              { id: 'f2', label: 'Due date', type: 'date' },
              { id: 'f3', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
            ],
          },
        },
        {
          id: 'proc',
          type: 'script',
          position: { x: 500, y: 130 },
          data: {
            label: 'process.py',
            description: 'Script: path, args & snippet',
            nodeType: 'script',
            scriptPath: 'process.py',
            scriptSnippet: 'print("processing", title)',
            params: { args: [{ id: 'a1', key: 'mode', value: 'standard' }] },
          },
        },
        {
          id: 'cond',
          type: 'condition',
          position: { x: 800, y: 150 },
          data: { label: 'Approved?', nodeType: 'condition', params: { expression: "status == 'approved'" } },
        },
        { id: 'ok', type: 'end', position: { x: 1080, y: 70 }, data: { label: 'Approved', nodeType: 'end', params: {} } },
        { id: 'no', type: 'end', position: { x: 1080, y: 250 }, data: { label: 'Rejected', nodeType: 'end', params: {} } },
        {
          id: 'tip',
          type: 'note',
          position: { x: 200, y: 360 },
          width: 260,
          height: 120,
          data: { label: 'Note', nodeType: 'note', params: { text: 'Select any node to edit it on the right. Drag from a node edge to connect.' } },
        },
        {
          id: 'frame',
          type: 'frame',
          position: { x: 170, y: 60 },
          width: 470,
          height: 250,
          zIndex: -1,
          data: { label: 'Intake', nodeType: 'frame', params: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'form', data: { style: { arrow: true } } },
        { id: 'e2', source: 'form', target: 'proc', label: 'submit', data: { style: { arrow: true } } },
        { id: 'e3', source: 'proc', target: 'cond', data: { style: { arrow: true } } },
        { id: 'e4', source: 'cond', sourceHandle: 'true', target: 'ok', label: 'yes', data: { style: { arrow: true } } },
        { id: 'e5', source: 'cond', sourceHandle: 'false', target: 'no', label: 'no', data: { style: { arrow: true } } },
      ],
    },
  },
}

// 2 ─ Branching & data: switch/case (+default), fetch/transform data nodes with
//     sample output, a decision diamond, and a media node.
const branching: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Tour 2 · Branching & Data',
    version: '1.0.0',
    description: 'Switch/case with a default branch, data nodes with sample output, a decision diamond and a media preview.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 200 }, data: { label: 'Start', nodeType: 'start', params: {} } },
        {
          id: 'fetch',
          type: 'data',
          position: { x: 200, y: 190 },
          data: {
            label: 'Fetch orders',
            description: 'Data node with sample output',
            nodeType: 'data',
            params: { method: 'GET', url: 'https://api.example.com/orders' },
            simulatedOutput: { orders: [{ id: 1, status: 'paid' }], count: 1 },
            icon: 'globe',
          },
        },
        {
          id: 'sw',
          type: 'switch',
          position: { x: 470, y: 180 },
          data: {
            label: 'Route by status',
            nodeType: 'switch',
            params: { expression: 'order.status' },
            cases: [
              { id: 'c-paid', when: "'paid'" },
              { id: 'c-pending', when: "'pending'" },
            ],
          },
        },
        { id: 'fulfil', type: 'data', position: { x: 780, y: 60 }, data: { label: 'Fulfil order', nodeType: 'data', params: {}, icon: 'package' } },
        { id: 'remind', type: 'data', position: { x: 780, y: 200 }, data: { label: 'Send reminder', nodeType: 'data', params: {}, icon: 'mail' } },
        {
          id: 'dec',
          type: 'decision',
          position: { x: 760, y: 330 },
          data: { label: 'Retry?', nodeType: 'decision', params: { expression: 'attempts < 3' } },
        },
        { id: 'retry', type: 'data', position: { x: 1080, y: 300 }, data: { label: 'Queue retry', nodeType: 'data', params: {}, icon: 'refresh' } },
        {
          id: 'banner',
          type: 'media',
          position: { x: 1080, y: 430 },
          data: { label: 'Status banner', nodeType: 'media', params: { kind: 'image', url: 'https://placehold.co/240x120' } },
        },
        { id: 'end', type: 'end', position: { x: 1120, y: 130 }, data: { label: 'Done', nodeType: 'end', params: {} } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'fetch', data: { style: { arrow: true } } },
        { id: 'e2', source: 'fetch', target: 'sw', data: { style: { arrow: true } } },
        { id: 'e3', source: 'sw', sourceHandle: 'c-paid', target: 'fulfil', label: 'paid', data: { style: { arrow: true } } },
        { id: 'e4', source: 'sw', sourceHandle: 'c-pending', target: 'remind', label: 'pending', data: { style: { arrow: true } } },
        { id: 'e5', source: 'sw', sourceHandle: SWITCH_DEFAULT_HANDLE, target: 'dec', label: 'other', data: { style: { arrow: true } } },
        { id: 'e6', source: 'dec', sourceHandle: 'true', target: 'retry', label: 'yes', data: { style: { arrow: true } } },
        { id: 'e7', source: 'fulfil', target: 'end', data: { style: { arrow: true } } },
        { id: 'e8', source: 'remind', target: 'end', data: { style: { arrow: true } } },
      ],
    },
  },
}

// 3 ─ Sub-flows, two-way links, control nodes & styling.
const advanced: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Tour 3 · Sub-flows, Links & Style',
    version: '1.0.0',
    description: 'A sub-flow you can drill into, a two-way service link, loop/delay/error control nodes, and a custom-styled node.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 200 }, data: { label: 'Start', nodeType: 'start', params: {} } },
        {
          id: 'validate',
          type: 'subflow',
          position: { x: 200, y: 190 },
          data: { label: 'Validation steps', description: 'Double-click to open', nodeType: 'subflow', params: {}, subFlowId: 'sub-validate' },
        },
        { id: 'svcA', type: 'data', position: { x: 480, y: 80 }, data: { label: 'Service A', nodeType: 'data', params: {}, icon: 'server' } },
        { id: 'svcB', type: 'data', position: { x: 480, y: 300 }, data: { label: 'Service B (DB)', nodeType: 'data', params: {}, icon: 'database' } },
        { id: 'loop', type: 'condition', position: { x: 760, y: 90 }, data: { label: 'Loop', nodeType: 'condition', params: { expression: 'has more' }, icon: 'repeat' } },
        { id: 'delay', type: 'script', position: { x: 760, y: 230 }, data: { label: 'Wait 5s', nodeType: 'script', params: { args: [{ id: 'd', key: 'duration', value: '5s' }] }, icon: 'timer' } },
        {
          id: 'styled',
          type: 'data',
          position: { x: 1040, y: 110 },
          data: {
            label: 'Styled node',
            description: 'Custom icon + colours',
            nodeType: 'data',
            params: {},
            icon: 'rocket',
            style: { iconBg: '#fde68a', textColor: '#b45309', borderColor: '#f59e0b' },
          },
        },
        { id: 'err', type: 'condition', position: { x: 1040, y: 280 }, data: { label: 'Error Handler', nodeType: 'condition', params: { expression: 'on error' }, icon: 'alert' } },
        { id: 'end', type: 'end', position: { x: 1320, y: 200 }, data: { label: 'Done', nodeType: 'end', params: {} } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'validate', data: { style: { arrow: true } } },
        { id: 'e2', source: 'validate', target: 'svcA', data: { style: { arrow: true } } },
        // two-way mid-handle link (Service A ⇄ Service B)
        { id: 'e3', source: 'svcA', sourceHandle: 'bottom', target: 'svcB', targetHandle: 'top', label: 'sync', data: { style: { arrow: true, arrowStart: true } } },
        { id: 'e4', source: 'svcA', target: 'loop', data: { style: { arrow: true } } },
        { id: 'e5', source: 'loop', sourceHandle: 'true', target: 'delay', label: 'again', data: { style: { arrow: true } } },
        { id: 'e6', source: 'loop', sourceHandle: 'false', target: 'styled', label: 'done', data: { style: { arrow: true } } },
        { id: 'e7', source: 'styled', target: 'end', data: { style: { arrow: true } } },
        { id: 'e8', source: 'err', sourceHandle: 'false', target: 'end', label: 'ok', data: { style: { arrow: true } } },
      ],
    },
    'sub-validate': {
      settings: { direction: 'lr' },
      nodes: [
        { id: 'vs', type: 'start', position: { x: 0, y: 80 }, data: { label: 'In', nodeType: 'start', params: {} } },
        { id: 'v1', type: 'script', position: { x: 200, y: 70 }, data: { label: 'Check schema', nodeType: 'script', params: {} } },
        { id: 'v2', type: 'script', position: { x: 460, y: 70 }, data: { label: 'Check limits', nodeType: 'script', params: {} } },
        { id: 've', type: 'end', position: { x: 720, y: 80 }, data: { label: 'Out', nodeType: 'end', params: {} } },
      ],
      edges: [
        { id: 've1', source: 'vs', target: 'v1', data: { style: { arrow: true } } },
        { id: 've2', source: 'v1', target: 'v2', data: { style: { arrow: true } } },
        { id: 've3', source: 'v2', target: 've', data: { style: { arrow: true } } },
      ],
    },
  },
}

// 4 ─ Phase frames, right-angle (step) routing & feedback loops.
//     An execution/judgment agent loop built from grouping frames, step edges,
//     mid-side handles for the loop-backs, and per-edge colour.
const agentLoop: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Tour 4 · Phases, Loops & Step Arrows',
    version: '1.0.0',
    description: 'Two phase frames, right-angle (step) edges, and feedback loops wired through mid-side handles.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        { id: 'exec_frame', type: 'frame', position: { x: 40, y: 60 }, width: 470, height: 360, zIndex: -1, data: { label: 'EXECUTION PHASE', nodeType: 'frame', params: {} } },
        { id: 'judge_frame', type: 'frame', position: { x: 560, y: 60 }, width: 540, height: 360, zIndex: -1, data: { label: 'JUDGMENT PHASE', nodeType: 'frame', params: {} } },
        { id: 'executor', type: 'data', position: { x: 150, y: 150 }, data: { label: 'Executor Agent', nodeType: 'data', params: {}, icon: 'settings', style: { borderColor: '#d99a3a', iconBg: '#f6e6cf' } } },
        { id: 'code', type: 'data', position: { x: 330, y: 290 }, data: { label: 'Code', nodeType: 'data', params: {}, icon: 'code', style: { borderColor: '#d99a3a', iconBg: '#f6e6cf' } } },
        { id: 'evaluator', type: 'data', position: { x: 700, y: 150 }, data: { label: 'Evaluator Agent', nodeType: 'data', params: {}, icon: 'search', style: { borderColor: '#3b82f6', iconBg: '#dbe9fe' } } },
        { id: 'evidence', type: 'data', position: { x: 920, y: 290 }, data: { label: 'Evidence', nodeType: 'data', params: {}, icon: 'clipboard', style: { borderColor: '#3b82f6', iconBg: '#dbe9fe' } } },
        { id: 'verdict', type: 'data', position: { x: 700, y: 330 }, data: { label: 'Verdict', nodeType: 'data', params: {}, icon: 'check', style: { borderColor: '#475569' } } },
        { id: 'deployed', type: 'end', position: { x: 700, y: 490 }, data: { label: 'Deployed / Complete', nodeType: 'end', params: {}, icon: 'flag' } },
      ],
      edges: [
        { id: 'e_exec_code', source: 'executor', target: 'code', sourceHandle: 'bottom', targetHandle: 'left', data: { style: { arrow: true, pathType: 'step', stroke: '#d99a3a' } } },
        { id: 'e_submit', source: 'code', target: 'evaluator', label: 'Submit for Review', sourceHandle: 'right', targetHandle: 'left', data: { style: { arrow: true, pathType: 'step', stroke: '#d99a3a' } } },
        { id: 'e_changes', source: 'code', target: 'executor', label: 'Changes & Iterates', sourceHandle: 'left', targetHandle: 'left', data: { style: { arrow: true, pathType: 'step', stroke: '#d99a3a' } } },
        { id: 'e_continue', source: 'evaluator', target: 'executor', label: 'Continue', sourceHandle: 'top', targetHandle: 'top', data: { style: { arrow: true, pathType: 'step', stroke: '#3b82f6' } } },
        { id: 'e_reviews', source: 'evaluator', target: 'evidence', label: 'Reviews & Analyzes', sourceHandle: 'right', targetHandle: 'top', data: { style: { arrow: true, pathType: 'step', stroke: '#3b82f6' } } },
        { id: 'e_verdict', source: 'evaluator', target: 'verdict', sourceHandle: 'bottom', targetHandle: 'top', data: { style: { arrow: true, pathType: 'step', stroke: '#3b82f6' } } },
        { id: 'e_finish', source: 'verdict', target: 'deployed', label: 'Finish', sourceHandle: 'bottom', targetHandle: 'top', data: { style: { arrow: true, pathType: 'step', stroke: '#475569' } } },
      ],
    },
  },
}

export const showcaseTemplates: WorkflowTemplate[] = [
  { id: 'tour-basics', name: 'Tour 1 · Basics & Forms', description: basics.settings.description ?? '', doc: basics },
  { id: 'tour-branching', name: 'Tour 2 · Branching & Data', description: branching.settings.description ?? '', doc: branching },
  { id: 'tour-advanced', name: 'Tour 3 · Sub-flows, Links & Style', description: advanced.settings.description ?? '', doc: advanced },
  { id: 'tour-agent-loop', name: 'Tour 4 · Phases, Loops & Step Arrows', description: agentLoop.settings.description ?? '', doc: agentLoop },
]
