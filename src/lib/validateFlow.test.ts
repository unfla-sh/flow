import { describe, expect, it } from 'vitest'

import type { FlowGraph, WorkflowNode } from '@/types/workflow'
import { issueCounts, validateFlow } from './validateFlow'

const node = (id: string, nodeType: WorkflowNode['data']['nodeType']): WorkflowNode => ({
  id,
  type: nodeType,
  position: { x: 0, y: 0 },
  data: { label: id, nodeType, params: {} },
})

const graph = (nodes: WorkflowNode[], edges: FlowGraph['edges']): FlowGraph => ({ nodes, edges })

describe('validateFlow', () => {
  it('reports no issues for a connected start→…→end flow', () => {
    const g = graph(
      [node('s', 'start'), node('a', 'script'), node('e', 'end')],
      [
        { id: '1', source: 's', target: 'a' },
        { id: '2', source: 'a', target: 'e' },
      ],
    )
    expect(validateFlow(g)).toHaveLength(0)
  })

  it('flags a missing start and an orphan node', () => {
    const g = graph([node('a', 'script'), node('orphan', 'data')], [])
    const issues = validateFlow(g)
    expect(issues.some((i) => i.id === 'no-start')).toBe(true)
    expect(issues.some((i) => i.id.startsWith('orphan-'))).toBe(true)
  })

  it('flags an unreachable node', () => {
    const g = graph(
      [node('s', 'start'), node('a', 'script'), node('island', 'script'), node('e', 'end')],
      [
        { id: '1', source: 's', target: 'a' },
        { id: '2', source: 'a', target: 'e' },
        { id: '3', source: 'island', target: 'e' }, // island has outgoing but no path from start
      ],
    )
    expect(validateFlow(g).some((i) => i.id === 'unreachable-island')).toBe(true)
  })

  it('flags a dangling edge to a missing node as an error', () => {
    const g = graph([node('s', 'start')], [{ id: 'x', source: 's', target: 'ghost' }])
    const issues = validateFlow(g)
    expect(issues.some((i) => i.severity === 'error' && i.id.startsWith('dangling-'))).toBe(true)
  })

  it('flags a switch without a default branch', () => {
    const sw = node('w', 'switch')
    sw.data.cases = [{ id: 'c1', when: 'a' }]
    const g = graph(
      [node('s', 'start'), sw, node('t', 'data')],
      [
        { id: '1', source: 's', target: 'w' },
        { id: '2', source: 'w', sourceHandle: 'c1', target: 't' },
      ],
    )
    const issues = validateFlow(g)
    expect(issues.some((i) => i.id === 'switch-default-w')).toBe(true)
  })

  it('ignores note/frame annotation nodes in connectivity checks', () => {
    const g = graph(
      [node('s', 'start'), node('e', 'end'), node('n', 'note'), node('f', 'frame')],
      [{ id: '1', source: 's', target: 'e' }],
    )
    const issues = validateFlow(g)
    expect(issues.some((i) => i.nodeId === 'n' || i.nodeId === 'f')).toBe(false)
  })

  it('counts issues by severity', () => {
    const counts = issueCounts([
      { id: 'a', severity: 'error', message: '' },
      { id: 'b', severity: 'warning', message: '' },
      { id: 'c', severity: 'warning', message: '' },
      { id: 'd', severity: 'info', message: '' },
    ])
    expect(counts).toEqual({ error: 1, warning: 2, info: 1 })
  })

  it('does not apply workflow start/end rules to architecture diagrams', () => {
    const g = graph(
      [node('firewall', 'resource'), node('server', 'resource')],
      [{ id: 'network', source: 'firewall', target: 'server', data: { kind: 'network' } }],
    )
    const issues = validateFlow(g, 'infrastructure')
    expect(issues.some((issue) => issue.id === 'no-start' || issue.id === 'no-end')).toBe(false)
  })

  it('detects organization reporting cycles', () => {
    const a = node('a', 'profile')
    a.data.params = { title: 'Director' }
    const b = node('b', 'profile')
    b.data.params = { title: 'Manager' }
    const g = graph(
      [a, b],
      [
        { id: '1', source: 'a', target: 'b', data: { kind: 'reporting' } },
        { id: '2', source: 'b', target: 'a', data: { kind: 'reporting' } },
      ],
    )
    expect(validateFlow(g, 'organization').some((issue) => issue.id === 'reporting-cycle')).toBe(true)
  })

  it('validates database field uniqueness and primary keys', () => {
    const table = node('users', 'record')
    table.data.fields = [
      { id: '1', name: 'email', dataType: 'text' },
      { id: '2', name: 'email', dataType: 'text' },
    ]
    const issues = validateFlow(graph([table], []), 'database')
    expect(issues.some((issue) => issue.id === 'duplicate-field-users')).toBe(true)
    expect(issues.some((issue) => issue.id === 'missing-primary-key-users')).toBe(true)
  })
})
