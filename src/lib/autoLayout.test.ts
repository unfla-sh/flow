import { describe, expect, it } from 'vitest'

import type { WorkflowDoc, WorkflowNode } from '@/types/workflow'
import { computeLayout, finalizeImportedDoc } from './autoLayout'

const n = (id: string, type: WorkflowNode['data']['nodeType'] = 'data'): WorkflowNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label: id, nodeType: type, params: {} },
})

describe('autoLayout', () => {
  it('assigns positions for all non-frame nodes', () => {
    const nodes = [n('a'), n('b'), n('c')]
    const edges = [
      { id: '1', source: 'a', target: 'b' },
      { id: '2', source: 'b', target: 'c' },
    ]
    const pos = computeLayout(nodes, edges, 'lr')
    expect(pos.has('a')).toBe(true)
    expect(pos.has('c')).toBe(true)
    // LR: c should be to the right of a
    expect(pos.get('c')!.x).toBeGreaterThan(pos.get('a')!.x)
  })

  it('skips frame nodes', () => {
    const pos = computeLayout([n('a'), n('frame', 'frame')], [], 'lr')
    expect(pos.has('frame')).toBe(false)
  })

  it('lays out TB top-to-bottom', () => {
    const pos = computeLayout([n('a'), n('b')], [{ id: '1', source: 'a', target: 'b' }], 'tb')
    expect(pos.get('b')!.y).toBeGreaterThan(pos.get('a')!.y)
  })

  it('finalizeImportedDoc only repositions all-origin flows', () => {
    const doc: WorkflowDoc = {
      schemaVersion: 1,
      settings: { name: 't', version: '1' },
      flows: {
        root: {
          settings: { direction: 'lr' },
          nodes: [n('a'), n('b')],
          edges: [{ id: '1', source: 'a', target: 'b' }],
        },
        placed: {
          nodes: [{ ...n('x'), position: { x: 500, y: 500 } }],
          edges: [],
        },
      },
    }
    const out = finalizeImportedDoc(doc)
    // origin flow gets laid out
    const a = out.flows.root.nodes.find((node) => node.id === 'a')!
    const b = out.flows.root.nodes.find((node) => node.id === 'b')!
    expect(a.position.x !== 0 || b.position.x !== 0).toBe(true)
    // already-placed flow is untouched
    expect(out.flows.placed.nodes[0].position).toEqual({ x: 500, y: 500 })
  })
})
