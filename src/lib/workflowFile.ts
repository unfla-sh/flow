import { z } from 'zod'

import {
  ROOT_FLOW_ID,
  type FlowGraph,
  type WorkflowDoc,
  type WorkflowNode,
} from '@/types/workflow'

const formFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'daterange', 'select', 'multiselect', 'checkbox']),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.unknown().optional(),
})

const switchCaseSchema = z.object({
  id: z.string(),
  when: z.string(),
})

const nodeDataSchema = z.looseObject({
  label: z.string(),
  description: z.string().optional(),
  nodeType: z.enum([
    'start',
    'end',
    'decision',
    'script',
    'form',
    'data',
    'condition',
    'switch',
    'subflow',
    'note',
    'frame',
    'media',
  ]),
  params: z.record(z.string(), z.unknown()),
  style: z
    .object({
      borderColor: z.string().optional(),
      fillColor: z.string().optional(),
      borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
      iconBg: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
  icon: z.string().optional(),
  formSchema: z.array(formFieldSchema).optional(),
  cases: z.array(switchCaseSchema).optional(),
  simulatedOutput: z.unknown().optional(),
  scriptPath: z.string().optional(),
  scriptSnippet: z.string().optional(),
  subFlowId: z.string().optional(),
})

const nodeSchema = z.looseObject({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: nodeDataSchema,
})

const edgeSchema = z.looseObject({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullish(),
  targetHandle: z.string().nullish(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
  data: z
    .looseObject({
      condition: z.string().optional(),
      route: z
        .object({
          kind: z.enum(['auto', 'manual']),
          points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
        })
        .optional(),
      style: z
        .object({
          stroke: z.string().optional(),
          arrow: z.boolean().optional(),
          arrowStart: z.boolean().optional(),
          bidirectional: z.boolean().optional(),
          lineWidth: z.number().optional(),
          arrowSize: z.number().optional(),
          pathType: z.enum(['bezier', 'step']).optional(),
        })
        .optional(),
    })
    .optional(),
})

const flowGraphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  settings: z.object({ direction: z.enum(['lr', 'tb']).optional() }).optional(),
})

export const workflowDocSchema = z
  .object({
    schemaVersion: z.literal(1),
    settings: z.object({
      name: z.string(),
      version: z.string(),
      description: z.string().optional(),
    }),
    flows: z.record(z.string(), flowGraphSchema),
    meta: z
      .object({
        appVersion: z.string().optional(),
        exportedAt: z.string().optional(),
      })
      .optional(),
  })
  .refine((doc) => ROOT_FLOW_ID in doc.flows, {
    message: `flows must contain a "${ROOT_FLOW_ID}" flow`,
  })

/** Strip React Flow runtime fields so saved/exported files stay clean. */
export function sanitizeDoc(doc: WorkflowDoc): WorkflowDoc {
  const cleanGraph = (graph: FlowGraph): FlowGraph => ({
    nodes: graph.nodes.map((node) => {
      const { selected, dragging, measured, ...rest } = node as WorkflowNode & {
        measured?: unknown
      }
      void selected
      void dragging
      void measured
      return rest as WorkflowNode
    }),
    edges: graph.edges.map((edge) => {
      const { selected, ...rest } = edge
      void selected
      return rest
    }),
  })
  return {
    schemaVersion: 1,
    settings: { ...doc.settings },
    flows: Object.fromEntries(
      Object.entries(doc.flows).map(([id, graph]) => [id, cleanGraph(graph)]),
    ),
    ...(doc.meta ? { meta: doc.meta } : {}),
  }
}

export function serializeDoc(doc: WorkflowDoc): string {
  return JSON.stringify(sanitizeDoc(doc), null, 2)
}

export type ParseResult = { ok: true; doc: WorkflowDoc } | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function slugId(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base
  let index = 2
  while (used.has(id)) {
    id = `${base}-${index}`
    index += 1
  }
  used.add(id)
  return id
}

function normalizeWorkflowInput(raw: unknown): unknown {
  if (!isRecord(raw) || !isRecord(raw.flows)) return raw

  const flows = Object.fromEntries(
    Object.entries(raw.flows).map(([flowId, flow]) => {
      if (!isRecord(flow)) return [flowId, flow]

      const usedNodeIds = new Set<string>()
      const nodes = Array.isArray(flow.nodes)
        ? flow.nodes.map((node, index) => {
            if (!isRecord(node)) return node
            const data = isRecord(node.data) ? node.data : {}
            const existingId = typeof node.id === 'string' && node.id.trim() ? node.id : undefined
            const base = existingId ?? slugId(data.label, `node-${index + 1}`)
            const id = uniqueId(base, usedNodeIds)
            return {
              ...node,
              id,
              type: typeof node.type === 'string' ? node.type : data.nodeType,
            }
          })
        : flow.nodes

      const usedEdgeIds = new Set<string>()
      const edges = Array.isArray(flow.edges)
        ? flow.edges.map((edge, index) => {
            if (!isRecord(edge)) return edge
            const existingId = typeof edge.id === 'string' && edge.id.trim() ? edge.id : undefined
            return { ...edge, id: uniqueId(existingId ?? `edge-${index + 1}`, usedEdgeIds) }
          })
        : flow.edges

      return [flowId, { ...flow, nodes, edges }]
    }),
  )

  return { ...raw, flows }
}

function escapeRawControlCharsInJsonStrings(text: string): string {
  let output = ''
  let inString = false
  let escaped = false

  for (const char of text) {
    if (!inString) {
      output += char
      if (char === '"') inString = true
      continue
    }

    if (escaped) {
      output += char
      escaped = false
      continue
    }

    if (char === '\\') {
      output += char
      escaped = true
      continue
    }

    if (char === '"') {
      output += char
      inString = false
      continue
    }

    if (char === '\n') {
      output += '\\n'
    } else if (char === '\r') {
      output += '\\r'
    } else if (char === '\t') {
      output += '\\t'
    } else if (char < ' ') {
      output += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
    } else {
      output += char
    }
  }

  return output
}

export function parseWorkflowFile(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (err) {
    try {
      raw = JSON.parse(escapeRawControlCharsInJsonStrings(text))
    } catch {
      return { ok: false, error: `Not valid JSON: ${err instanceof Error ? err.message : err}` }
    }
  }
  raw = normalizeWorkflowInput(raw)
  const result = workflowDocSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue.path.join('.') || '(root)'
    return { ok: false, error: `Invalid workflow file at ${path}: ${issue.message}` }
  }
  return { ok: true, doc: result.data as WorkflowDoc }
}
