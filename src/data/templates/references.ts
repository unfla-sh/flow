import type { WorkflowDoc } from '@/types/workflow'

import type { WorkflowTemplate } from './types'

/**
 * Diagrams redrawn from reference images (see /reference in the repo) as
 * runnable workflows, so the simulator and the AI "modify" path can be
 * exercised on realistic shapes: a four-way switch with loop-backs, and a
 * component graph with a drill-down sub-flow.
 */

// Legend colours from the Commerce Agent reference: blue = enforced by the
// harness, amber = stops for a human, white = the model or a system you run.
const HARNESS = { borderColor: '#3b5bdb', fillColor: '#eef2ff' }
const HUMAN = { borderColor: '#d9a441', fillColor: '#fff8e6' }
const MODEL = { borderColor: '#7c6bd0', fillColor: '#f3f0ff' }

const ARROW = { style: { arrow: true } }
const STEP = { style: { arrow: true, pathType: 'step' as const } }
const TWO_WAY = { style: { arrow: true, arrowStart: true, pathType: 'step' as const } }
const LOOP_BACK = { style: { arrow: true, pathType: 'step' as const, lineStyle: 'dashed' as const, stroke: '#94a3b8' } }

const READ_X = 0
const WRITE_X = 330
const PRESENT_X = 660
const FINAL_X = 990
const ROW = 110

function step(id: string, label: string, description: string, x: number, row: number, style?: Record<string, string>, icon = 'lock'): WorkflowDoc['flows'][string]['nodes'][number] {
  return {
    id,
    type: 'script',
    position: { x, y: 560 + row * ROW },
    data: { label, description, nodeType: 'script', definitionId: 'script', params: {}, icon, ...(style ? { style } : {}) },
  }
}

const commerceAgent: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Reference · Commerce Agent Architecture',
    version: '1.0.0',
    description:
      'One turn of a commerce agent: prompt assembly, a model call, a four-way switch on what it emitted, and a write path that stops for a human. Steer the simulation from the model call’s Data tab.',
    diagramKind: 'workflow',
  },
  flows: {
    root: {
      settings: { direction: 'tb' },
      nodes: [
        { id: 'start', type: 'start', position: { x: 500, y: 0 }, data: { label: 'user message arrives', nodeType: 'start', definitionId: 'start', params: {} } },
        {
          id: 'assemble',
          type: 'script',
          position: { x: 470, y: 100 },
          data: {
            label: 'assemble the prompt',
            description: '1 global · 2 session · 3 volatile',
            nodeType: 'script',
            definitionId: 'script',
            icon: 'layers',
            style: HARNESS,
            params: {
              args: [
                { id: 'a1', key: 'global', value: 'system prompt, tool defs · breakpoint here' },
                { id: 'a2', key: 'session', value: 'user context, history, memory reads' },
                { id: 'a3', key: 'volatile', value: 'time, current page · last, always' },
              ],
            },
          },
        },
        {
          id: 'model',
          type: 'data',
          position: { x: 470, y: 220 },
          data: {
            label: 'model call',
            description: 'stateless · prompt, tools, messages. Data tab → change "emitted" to steer the simulation.',
            nodeType: 'data',
            definitionId: 'fetch',
            icon: 'brain',
            style: MODEL,
            params: { method: 'POST', url: 'https://api.anthropic.com/v1/messages' },
            simulatedOutput: { emitted: 'write_tool_call' },
          },
        },
        {
          id: 'emit',
          type: 'switch',
          position: { x: 476, y: 350 },
          data: {
            label: 'what did it emit?',
            nodeType: 'switch',
            definitionId: 'switch',
            params: { expression: 'emitted' },
            cases: [
              { id: 'c-read', when: "'read_tool_call'" },
              { id: 'c-write', when: "'write_tool_call'" },
              { id: 'c-present', when: "'presentation_call'" },
              { id: 'c-final', when: "'final_text'" },
            ],
          },
        },

        // read tool call
        step('dispatch', 'dispatch as args complete', 'fire each call before the block finishes', READ_X, 0, HARNESS, 'zap'),
        {
          id: 'backend',
          type: 'data',
          position: { x: READ_X, y: 560 + ROW },
          data: { label: 'call the backend', description: 'results arrive already ranked', nodeType: 'data', definitionId: 'fetch', icon: 'server', params: { method: 'GET', url: 'https://catalog.internal/search' }, simulatedOutput: { results: 12 } },
        },
        step('sanitize', 'sanitize · fence · label', 'strip control chars, cap size, fixed fence', READ_X, 2, HARNESS, 'filter'),

        // write tool call
        step('validate-w', 'validate ID against the registry', 'only IDs the server issued this session', WRITE_X, 0, HARNESS, 'key'),
        step('caps', 'check caps on resulting state', 'on the line after the write, not the request', WRITE_X, 1, HARNESS, 'sigma'),
        step('serialize', 'serialize writes per session', 'parallel calls in one turn cannot stack', WRITE_X, 2, HARNESS, 'layers'),
        step('stage', 'stage it · return a server ID', 'the write tool has no apply path at all', WRITE_X, 3, HARNESS, 'clipboard'),
        {
          id: 'approve',
          type: 'form',
          position: { x: WRITE_X, y: 560 + 4 * ROW },
          data: {
            label: 'a person, or a policy, approves',
            description: 'portal button, CLI confirm, platform prompt',
            nodeType: 'form',
            definitionId: 'form',
            icon: 'user',
            style: HUMAN,
            params: {},
            formSchema: [{ id: 'ok', label: 'Approve this write?', type: 'checkbox', required: true }],
          },
        },
        step('recheck', 're-check caps at apply time', "against today's limits, not the staged ones", WRITE_X, 5, HARNESS, 'sigma'),
        step('apply', 'apply to the system', 'succeeds only for an approved ID', WRITE_X, 6, undefined, 'check'),

        // presentation call
        step('validate-p', 'validate ID against the registry', 'same rule as any write', PRESENT_X, 0, HARNESS, 'key'),
        step('fill', 'server fills the records', 'model picks which, server supplies each field', PRESENT_X, 1, HARNESS, 'database'),
        step('stream', 'stream args to the client', 'each top-level argument as it completes', PRESENT_X, 2, HARNESS, 'send'),

        // final text
        step('turn-ends', 'turn ends', 'final text, no tool call', FINAL_X, 0, undefined, 'message'),
        step('memory', 'memory extractor', 'reads user and assistant text only', FINAL_X, 1, undefined, 'brain'),
        {
          id: 'facts',
          type: 'data',
          position: { x: FINAL_X, y: 560 + 2 * ROW },
          data: { label: 'typed facts', description: 'key · value · category · source', nodeType: 'data', definitionId: 'output', icon: 'table', params: {}, simulatedOutput: { facts: [{ key: 'size', value: 'M', category: 'preference', source: 'user' }] } },
        },
        { id: 'end', type: 'end', position: { x: FINAL_X + 30, y: 560 + 3 * ROW + 10 }, data: { label: 'turn complete', nodeType: 'end', definitionId: 'end', params: {} } },

        {
          id: 'legend',
          type: 'note',
          position: { x: 0, y: 60 },
          width: 300,
          height: 140,
          data: {
            label: 'Legend',
            nodeType: 'note',
            definitionId: 'note',
            params: {
              text: 'Blue = enforced by the harness. Amber = stops for a human. White = the model, or a system you already run.\n\nEvery result goes back into the messages array and the loop runs again until the model emits final text.',
            },
          },
        },
        {
          id: 'rules',
          type: 'note',
          position: { x: 990, y: 60 },
          width: 300,
          height: 200,
          data: {
            label: 'The four rules the chart encodes',
            nodeType: 'note',
            definitionId: 'note',
            params: {
              text: 'Order beats content — cache reads stop at the first differing byte.\nIDs are capabilities — the registry is the access model.\nLimits apply to state — check what the write would produce.\nProposing is the max — the checkout backend carries no charge method.',
            },
          },
        },
      ],
      edges: [
        { id: 'e-start', source: 'start', target: 'assemble', data: ARROW },
        { id: 'e-assemble', source: 'assemble', target: 'model', data: ARROW },
        { id: 'e-model', source: 'model', target: 'emit', data: ARROW },
        { id: 'e-read', source: 'emit', sourceHandle: 'c-read', target: 'dispatch', label: 'read tool call', data: ARROW },
        { id: 'e-write', source: 'emit', sourceHandle: 'c-write', target: 'validate-w', label: 'write tool call', data: { style: { arrow: true, stroke: '#d9a441' } } },
        { id: 'e-present', source: 'emit', sourceHandle: 'c-present', target: 'validate-p', label: 'presentation call', data: ARROW },
        { id: 'e-final', source: 'emit', sourceHandle: 'c-final', target: 'turn-ends', label: 'final text', data: ARROW },

        { id: 'e-r1', source: 'dispatch', target: 'backend', data: ARROW },
        { id: 'e-r2', source: 'backend', target: 'sanitize', data: ARROW },
        { id: 'e-r-loop', source: 'sanitize', sourceHandle: 'left', target: 'model', targetHandle: 'left', label: 'back into messages', data: LOOP_BACK },

        { id: 'e-w1', source: 'validate-w', target: 'caps', data: ARROW },
        { id: 'e-w2', source: 'caps', target: 'serialize', data: ARROW },
        { id: 'e-w3', source: 'serialize', target: 'stage', data: ARROW },
        { id: 'e-w4', source: 'stage', target: 'approve', data: { style: { arrow: true, stroke: '#d9a441' } } },
        { id: 'e-w5', source: 'approve', target: 'recheck', data: { style: { arrow: true, stroke: '#d9a441' } } },
        { id: 'e-w6', source: 'recheck', target: 'apply', data: ARROW },
        { id: 'e-w-loop', source: 'apply', sourceHandle: 'left', target: 'model', targetHandle: 'left', label: 'back into messages', data: LOOP_BACK },

        { id: 'e-p1', source: 'validate-p', target: 'fill', data: ARROW },
        { id: 'e-p2', source: 'fill', target: 'stream', data: ARROW },
        { id: 'e-p-loop', source: 'stream', sourceHandle: 'right', target: 'model', targetHandle: 'right', label: 'back into messages', data: LOOP_BACK },

        { id: 'e-f1', source: 'turn-ends', target: 'memory', data: ARROW },
        { id: 'e-f2', source: 'memory', target: 'facts', data: ARROW },
        { id: 'e-f3', source: 'facts', target: 'end', data: ARROW },
      ],
    },
  },
}

const component = (
  id: string,
  label: string,
  description: string,
  x: number,
  y: number,
  icon: string,
  definitionId: 'script' | 'fetch' | 'output' = 'script',
): WorkflowDoc['flows'][string]['nodes'][number] => ({
  id,
  type: definitionId === 'script' ? 'script' : 'data',
  position: { x, y },
  data: { label, description, nodeType: definitionId === 'script' ? 'script' : 'data', definitionId, icon, params: {} },
})

const codeboardingPipeline: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Reference · CodeBoarding Diagram Pipeline',
    version: '1.0.0',
    description:
      'Component graph of the CodeBoarding analysis tool: the CLI drives a Diagram Generation Pipeline (double-click it to open the five inner stages) that fans out to the engines, agents, telemetry and renderers.',
    diagramKind: 'workflow',
  },
  flows: {
    root: {
      settings: { direction: 'tb' },
      nodes: [
        { id: 'cli', type: 'start', position: { x: 470, y: 0 }, data: { label: 'CLI and Workflow Orchestrator', description: '2 files', nodeType: 'start', definitionId: 'start', icon: 'terminal', params: {} } },
        {
          id: 'pipeline',
          type: 'subflow',
          position: { x: 440, y: 120 },
          data: {
            label: 'Diagram Generation Pipeline',
            description: 'Orchestrates full and incremental architecture analysis passes, assembling component scopes and analysis JSON models. 16 files · double-click to open.',
            nodeType: 'subflow',
            definitionId: 'subflow',
            icon: 'workflow',
            params: {},
            subFlowId: 'pipeline',
          },
        },
        component('health', 'Architecture Health Checks', '1 file · validates generated models', 0, 320, 'check'),
        component('static', 'Static Analysis Engine', '37 files · symbols, references, call graphs', 320, 320, 'search', 'fetch'),
        component('agents', 'AI Architecture Agents', '4 files · LLM-driven component analysis', 640, 320, 'bot'),
        component('entrypoints', 'Application Entrypoints and Tool Registry', '3 files · CLI commands, MCP tools', 960, 320, 'clipboard'),
        component('monitoring', 'Monitoring and Telemetry', '6 files · run logs, timings', 0, 490, 'activity'),
        component('renderers', 'Documentation and Diagram Renderers', '9 files · markdown, mermaid, html', 960, 490, 'file', 'output'),
        { id: 'out', type: 'end', position: { x: 990, y: 640 }, data: { label: 'docs & diagrams written', nodeType: 'end', definitionId: 'end', params: {} } },
      ],
      edges: [
        { id: 'e-cli', source: 'cli', target: 'pipeline', data: ARROW },
        { id: 'e-health', source: 'pipeline', target: 'health', label: 'validate', data: STEP },
        // Two-way: the pipeline asks, the engine/agents answer.
        { id: 'e-static', source: 'pipeline', target: 'static', label: 'analyse ⇄ symbols & relations', data: TWO_WAY },
        { id: 'e-agents', source: 'pipeline', target: 'agents', label: 'ask ⇄ component analysis', data: TWO_WAY },
        { id: 'e-entry', source: 'pipeline', target: 'entrypoints', label: 'register tools', data: STEP },
        // Outer-column targets attach from the sides so the routes hug the diagram edge.
        { id: 'e-mon', source: 'pipeline', sourceHandle: 'left', target: 'monitoring', targetHandle: 'left', label: 'emit telemetry', data: STEP },
        { id: 'e-render', source: 'pipeline', sourceHandle: 'right', target: 'renderers', targetHandle: 'right', label: 'render', data: STEP },
        { id: 'e-out', source: 'renderers', target: 'out', data: ARROW },
      ],
    },
    pipeline: {
      settings: { direction: 'tb' },
      nodes: [
        component('context', 'Analysis Context and Configuration', 'run context, depth cap, project name', 0, 0, 'settings'),
        component('orchestration', 'Analysis Orchestration and Serialization', 'full vs incremental passes, JSON models', 400, 0, 'workflow'),
        component('incremental', 'Incremental Graph Updating', 'changed files → affected components', 60, 170, 'repeat'),
        component('scope', 'Scope Assembly and Planning', 'component scopes for the agents', 340, 320, 'layers'),
        component('indexing', 'File Symbol Indexing and Coverage', 'which symbols each component owns', 200, 480, 'search', 'output'),
      ],
      edges: [
        { id: 'p-1', source: 'context', target: 'incremental', data: ARROW },
        { id: 'p-2', source: 'orchestration', target: 'scope', data: ARROW },
        { id: 'p-3', source: 'orchestration', target: 'indexing', data: ARROW },
        { id: 'p-4', source: 'incremental', target: 'scope', data: ARROW },
        { id: 'p-5', source: 'incremental', target: 'indexing', data: ARROW },
        { id: 'p-6', source: 'scope', target: 'indexing', data: ARROW },
      ],
    },
  },
}

export const referenceTemplates: WorkflowTemplate[] = [
  {
    id: 'ref-commerce-agent',
    name: 'Reference · Commerce Agent Architecture',
    description: commerceAgent.settings.description ?? '',
    doc: commerceAgent,
  },
  {
    id: 'ref-codeboarding-pipeline',
    name: 'Reference · CodeBoarding Diagram Pipeline',
    description: codeboardingPipeline.settings.description ?? '',
    doc: codeboardingPipeline,
  },
]
