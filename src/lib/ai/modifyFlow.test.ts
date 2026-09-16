import { describe, expect, it } from 'vitest'

import type { FlowGraph, WorkflowDoc, WorkflowNode } from '@/types/workflow'

import { FLOW_SCHEMA_PROMPT } from './flowSchemaPrompt'
import { buildFullModifyPrompt, parseModifiedText, placeNewNodes } from './modifyFlow'

function node(id: string, x: number, y: number, nodeType = 'script'): WorkflowNode {
  return {
    id,
    type: nodeType,
    position: { x, y },
    data: { label: id, nodeType: nodeType as WorkflowNode['data']['nodeType'], params: {} },
  }
}

const current: WorkflowDoc = {
  schemaVersion: 1,
  settings: { name: 'Demo', version: '1.0.0' },
  flows: {
    root: {
      nodes: [node('start', 0, 0, 'start'), node('a', 300, 0), node('b', 600, 0)],
      edges: [
        { id: 'e1', source: 'start', target: 'a' },
        { id: 'e2', source: 'a', target: 'b' },
      ],
      settings: { direction: 'lr' },
    },
  },
}

describe('placeNewNodes', () => {
  it('leaves known nodes alone and puts a new node after the node feeding it', () => {
    const next: FlowGraph = {
      ...current.flows.root,
      nodes: [...current.flows.root.nodes, node('c', 0, 0)],
      edges: [...current.flows.root.edges, { id: 'e3', source: 'b', target: 'c' }],
    }
    const placed = placeNewNodes(next, current.flows.root)
    expect(placed.nodes.find((n) => n.id === 'a')?.position).toEqual({ x: 300, y: 0 })
    expect(placed.nodes.find((n) => n.id === 'c')?.position).toEqual({ x: 880, y: 0 })
  })

  it('offsets a second new node that would land on the first', () => {
    const next: FlowGraph = {
      ...current.flows.root,
      nodes: [...current.flows.root.nodes, node('c', 0, 0), node('d', 0, 0)],
      edges: [
        ...current.flows.root.edges,
        { id: 'e3', source: 'b', target: 'c' },
        { id: 'e4', source: 'b', target: 'd' },
      ],
    }
    const placed = placeNewNodes(next, current.flows.root)
    const c = placed.nodes.find((n) => n.id === 'c')!.position
    const d = placed.nodes.find((n) => n.id === 'd')!.position
    expect(c.x).toBe(d.x)
    expect(Math.abs(c.y - d.y)).toBeGreaterThanOrEqual(100)
  })

  it('resolves a chain of new nodes and parks unconnected ones below the diagram', () => {
    const next: FlowGraph = {
      ...current.flows.root,
      nodes: [...current.flows.root.nodes, node('c', 0, 0), node('d', 0, 0), node('note', 0, 0, 'note')],
      edges: [
        ...current.flows.root.edges,
        { id: 'e3', source: 'b', target: 'c' },
        { id: 'e4', source: 'c', target: 'd' },
      ],
    }
    const placed = placeNewNodes(next, current.flows.root)
    const c = placed.nodes.find((n) => n.id === 'c')!.position
    const d = placed.nodes.find((n) => n.id === 'd')!.position
    const note = placed.nodes.find((n) => n.id === 'note')!.position
    expect(d.x).toBeGreaterThan(c.x)
    expect(note.y).toBeGreaterThan(0)
    expect(note.x).toBe(0)
  })

  it('places a new node before the node it feeds when it only has an outgoing edge', () => {
    const next: FlowGraph = {
      ...current.flows.root,
      nodes: [...current.flows.root.nodes, node('pre', 0, 0)],
      edges: [...current.flows.root.edges, { id: 'e3', source: 'pre', target: 'b' }],
    }
    const placed = placeNewNodes(next, current.flows.root)
    // b is at x=600; the slot before it (320) is free of other nodes (a is at 300 → too close),
    // so the node shifts down a row instead of stacking on "a".
    const pre = placed.nodes.find((n) => n.id === 'pre')!.position
    expect(pre.x).toBe(320)
    expect(pre.y).toBeGreaterThan(0)
  })
})

describe('parseModifiedText', () => {
  it('accepts a fenced full-document answer and places the new node', () => {
    const answer = {
      ...current,
      flows: {
        root: {
          ...current.flows.root,
          nodes: [...current.flows.root.nodes, node('c', 0, 0)],
          edges: [...current.flows.root.edges, { id: 'e3', source: 'b', target: 'c' }],
        },
      },
    }
    const result = parseModifiedText(`Done:\n\`\`\`json\n${JSON.stringify(answer)}\n\`\`\``, current)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.doc.flows.root.nodes.find((n) => n.id === 'c')?.position.x).toBe(880)
    expect(result.doc.flows.root.nodes.find((n) => n.id === 'a')?.position.x).toBe(300)
  })

  it('reports invalid answers instead of throwing', () => {
    const result = parseModifiedText('Sorry, I cannot do that.', current)
    expect(result.ok).toBe(false)
  })
})

describe('buildFullModifyPrompt', () => {
  it('carries the schema, the current document and the instruction', () => {
    const prompt = buildFullModifyPrompt(current, 'Add a review step after a')
    expect(prompt).toContain(FLOW_SCHEMA_PROMPT)
    expect(prompt).toContain('"id":"start"')
    expect(prompt).toContain('Add a review step after a')
  })
})
