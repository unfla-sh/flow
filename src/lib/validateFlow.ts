import {
  SWITCH_DEFAULT_HANDLE,
  type DiagramKind,
  type FlowGraph,
  type WorkflowEdge,
} from '@/types/workflow'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface FlowIssue {
  id: string
  severity: IssueSeverity
  message: string
  /** Node the issue points at, for select-on-click. */
  nodeId?: string
}

/** Annotation nodes don't participate in flow connectivity. Score cards may
 * be wired (e.g. bracket lines) but are display-only, so they aren't linted
 * for orphans/dead ends either. */
const isLogic = (type: string) => type !== 'note' && type !== 'frame' && type !== 'scorecard'

/**
 * Lint a flow for structural problems — the kind of checks n8n / Node-RED
 * surface: missing entry/exit, orphaned or unreachable nodes, dangling edges,
 * dead ends, and branch nodes with unwired outputs. Pure over the graph.
 */
function organizationIssues(graph: FlowGraph, outgoing: Map<string, WorkflowEdge[]>): FlowIssue[] {
  const issues: FlowIssue[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const reportingTargets = (id: string) =>
    (outgoing.get(id) ?? [])
      .filter(
        (edge) =>
          (edge.data?.kind ?? 'reporting') === 'reporting' &&
          edge.data?.style?.lineStyle !== 'dotted',
      )
      .map((edge) => edge.target)

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    const cycle = reportingTargets(id).some(visit)
    visiting.delete(id)
    visited.add(id)
    return cycle
  }

  if (graph.nodes.some((node) => visit(node.id))) {
    issues.push({
      id: 'reporting-cycle',
      severity: 'error',
      message: 'Reporting lines contain a cycle.',
    })
  }
  for (const node of graph.nodes.filter((item) => item.data.nodeType === 'profile')) {
    if (!String(node.data.params.title ?? '').trim()) {
      issues.push({
        id: `profile-title-${node.id}`,
        severity: 'info',
        message: `“${node.data.label}” has no role title.`,
        nodeId: node.id,
      })
    }
  }
  return issues
}

function databaseIssues(graph: FlowGraph): FlowIssue[] {
  const issues: FlowIssue[] = []
  for (const node of graph.nodes.filter((item) => item.data.nodeType === 'record')) {
    const fields = node.data.fields ?? []
    const names = fields.map((field) => field.name.trim().toLowerCase()).filter(Boolean)
    if (new Set(names).size !== names.length) {
      issues.push({
        id: `duplicate-field-${node.id}`,
        severity: 'error',
        message: `“${node.data.label}” has duplicate field names.`,
        nodeId: node.id,
      })
    }
    if (String(node.data.params.recordKind ?? 'Table').toLowerCase() !== 'view') {
      if (!fields.some((field) => field.key === 'primary')) {
        issues.push({
          id: `missing-primary-key-${node.id}`,
          severity: 'info',
          message: `“${node.data.label}” has no primary key.`,
          nodeId: node.id,
        })
      }
    }
  }
  return issues
}

export function validateFlow(graph: FlowGraph, diagramKind: DiagramKind = 'workflow'): FlowIssue[] {
  const issues: FlowIssue[] = []
  const nodes = graph.nodes
  const logic = nodes.filter((n) => isLogic(n.data.nodeType))
  if (logic.length === 0) return issues

  const ids = new Set(nodes.map((n) => n.id))
  const label = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id

  const outgoing = new Map<string, typeof graph.edges>()
  const incoming = new Map<string, number>()
  for (const edge of graph.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      issues.push({
        id: `dangling-${edge.id}`,
        severity: 'error',
        message: `Edge references a missing node (${edge.source} → ${edge.target}).`,
      })
      continue
    }
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
    outgoing.get(edge.source)!.push(edge)
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1)
  }

  if (diagramKind !== 'workflow') {
    if (diagramKind === 'organization') issues.push(...organizationIssues(graph, outgoing))
    if (diagramKind === 'database') issues.push(...databaseIssues(graph))
    return issues
  }

  const starts = logic.filter((n) => n.data.nodeType === 'start')
  const ends = logic.filter((n) => n.data.nodeType === 'end')
  if (starts.length === 0) {
    issues.push({ id: 'no-start', severity: 'warning', message: 'No Start node — the flow has no clear entry point.' })
  }
  if (ends.length === 0) {
    issues.push({ id: 'no-end', severity: 'info', message: 'No End node.' })
  }

  for (const node of logic) {
    const inCount = incoming.get(node.id) ?? 0
    const out = outgoing.get(node.id) ?? []
    const type = node.data.nodeType

    if (inCount === 0 && out.length === 0) {
      issues.push({ id: `orphan-${node.id}`, severity: 'warning', message: `"${label(node.id)}" is not connected to anything.`, nodeId: node.id })
      continue
    }
    if (type === 'start' && out.length === 0) {
      issues.push({ id: `start-noout-${node.id}`, severity: 'warning', message: `Start "${label(node.id)}" has no outgoing connection.`, nodeId: node.id })
    }
    if (type !== 'end' && type !== 'start' && out.length === 0) {
      issues.push({ id: `deadend-${node.id}`, severity: 'info', message: `"${label(node.id)}" is a dead end (no outgoing connection).`, nodeId: node.id })
    }
    if (type === 'end' && inCount === 0) {
      issues.push({ id: `end-noin-${node.id}`, severity: 'warning', message: `End "${label(node.id)}" has no incoming connection.`, nodeId: node.id })
    }

    // Branch nodes: check both outputs are wired.
    if (type === 'condition' && out.length > 0) {
      const handles = new Set(out.map((e) => e.sourceHandle ?? ''))
      if (!handles.has('true')) issues.push({ id: `cond-true-${node.id}`, severity: 'info', message: `Condition "${label(node.id)}" has no true branch.`, nodeId: node.id })
      if (!handles.has('false')) issues.push({ id: `cond-false-${node.id}`, severity: 'info', message: `Condition "${label(node.id)}" has no false branch.`, nodeId: node.id })
    }
    if (type === 'switch') {
      const handles = new Set(out.map((e) => e.sourceHandle ?? ''))
      const cases = node.data.cases ?? []
      for (const c of cases) {
        if (!handles.has(c.id)) issues.push({ id: `switch-case-${node.id}-${c.id}`, severity: 'info', message: `Switch "${label(node.id)}" case "${c.when || '…'}" is not wired.`, nodeId: node.id })
      }
      if (!handles.has(SWITCH_DEFAULT_HANDLE)) {
        issues.push({ id: `switch-default-${node.id}`, severity: 'info', message: `Switch "${label(node.id)}" has no default branch.`, nodeId: node.id })
      }
    }
  }

  // Unreachable from any start.
  if (starts.length > 0) {
    const seen = new Set<string>()
    const queue = starts.map((n) => n.id)
    while (queue.length) {
      const id = queue.shift()!
      if (seen.has(id)) continue
      seen.add(id)
      for (const e of outgoing.get(id) ?? []) queue.push(e.target)
    }
    for (const node of logic) {
      if (!seen.has(node.id)) {
        issues.push({ id: `unreachable-${node.id}`, severity: 'warning', message: `"${label(node.id)}" is not reachable from a Start node.`, nodeId: node.id })
      }
    }
  }

  return issues
}

export function issueCounts(issues: FlowIssue[]) {
  return {
    error: issues.filter((i) => i.severity === 'error').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  }
}
