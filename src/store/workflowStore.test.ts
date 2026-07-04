import { beforeEach, describe, expect, it } from 'vitest'

import { buildDemoDoc, useWorkflowStore } from './workflowStore'
import type { WorkflowDoc } from '@/types/workflow'

const reset = (doc?: WorkflowDoc) => {
  useWorkflowStore.getState().loadDoc(doc ?? buildDemoDoc())
}

beforeEach(() => reset())

const active = () => {
  const s = useWorkflowStore.getState()
  return s.doc.flows[s.activeFlowPath[s.activeFlowPath.length - 1]]
}

describe('workflowStore', () => {
  it('addNode appends a selected node and records it as recent', () => {
    const before = active().nodes.length
    useWorkflowStore.getState().addNode('fetch', { x: 10, y: 20 })
    const after = active().nodes
    expect(after).toHaveLength(before + 1)
    expect(after.at(-1)!.selected).toBe(true)
    expect(useWorkflowStore.getState().recentCatalogIds[0]).toBe('fetch')
  })

  it('copy + paste duplicates the selection with fresh ids', () => {
    const s = useWorkflowStore.getState()
    s.setSelectedNode('demo-script')
    s.copySelection()
    const before = active().nodes.length
    s.paste()
    const nodes = active().nodes
    expect(nodes).toHaveLength(before + 1)
    const ids = nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length) // all unique
  })

  it('deleteSelected removes the node and its connected edges', () => {
    const s = useWorkflowStore.getState()
    s.setSelectedNode('demo-form')
    s.deleteSelected()
    const g = active()
    expect(g.nodes.find((n) => n.id === 'demo-form')).toBeUndefined()
    expect(g.edges.some((e) => e.source === 'demo-form' || e.target === 'demo-form')).toBe(false)
  })

  it('replaceNodeType keeps the label and drops edges when becoming start/end', () => {
    const s = useWorkflowStore.getState()
    const before = active().nodes.find((n) => n.id === 'demo-script')!.data.label
    s.replaceNodeType('demo-script', 'end')
    const node = active().nodes.find((n) => n.id === 'demo-script')!
    expect(node.data.nodeType).toBe('end')
    expect(node.data.label).toBe(before)
    // an 'end' node should have no outgoing edges
    expect(active().edges.some((e) => e.source === 'demo-script')).toBe(false)
  })

  it('toggleEdgeTwoWay flips between one-way and two-way', () => {
    const s = useWorkflowStore.getState()
    s.toggleEdgeTwoWay('demo-e2')
    let e = active().edges.find((x) => x.id === 'demo-e2')!
    expect(e.data?.style?.arrow).toBe(true)
    expect(e.data?.style?.arrowStart).toBe(true)
    s.toggleEdgeTwoWay('demo-e2')
    e = active().edges.find((x) => x.id === 'demo-e2')!
    expect(e.data?.style?.arrowStart).toBe(false)
  })

  it('alignSelection aligns selected nodes to a shared left edge', () => {
    const s = useWorkflowStore.getState()
    // select two nodes via the React-Flow `selected` flag
    useWorkflowStore.setState((st) => {
      const g = st.doc.flows.root
      return {
        doc: {
          ...st.doc,
          flows: {
            ...st.doc.flows,
            root: {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === 'demo-form' || n.id === 'demo-script' ? { ...n, selected: true } : n,
              ),
            },
          },
        },
      }
    })
    s.alignSelection('left')
    const g = active()
    const a = g.nodes.find((n) => n.id === 'demo-form')!.position.x
    const b = g.nodes.find((n) => n.id === 'demo-script')!.position.x
    expect(a).toBeCloseTo(b, 5)
  })

  it('simulation steps from start through to finished', () => {
    const s = useWorkflowStore.getState()
    s.simReset()
    expect(useWorkflowStore.getState().sim.activeNodeIds).toContain('demo-start')
    // step until done (linear 4-node demo)
    for (let i = 0; i < 6 && useWorkflowStore.getState().sim.status !== 'done'; i++) {
      useWorkflowStore.getState().simStep()
    }
    const sim = useWorkflowStore.getState().sim
    expect(sim.status).toBe('done')
    expect(sim.doneNodeIds).toContain('demo-end')
    useWorkflowStore.getState().simStop()
    expect(useWorkflowStore.getState().sim.status).toBe('idle')
  })

  it('groupSelectionIntoSubFlow collapses selected nodes and reroutes crossing edges', () => {
    const s = useWorkflowStore.getState()
    // select form + script (internal edge demo-e2 between them; demo-e1 in, demo-e3 out)
    useWorkflowStore.setState((st) => {
      const g = st.doc.flows.root
      return {
        doc: {
          ...st.doc,
          flows: {
            ...st.doc.flows,
            root: {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === 'demo-form' || n.id === 'demo-script' ? { ...n, selected: true } : n,
              ),
            },
          },
        },
      }
    })
    s.groupSelectionIntoSubFlow()
    const st = useWorkflowStore.getState()
    const root = st.doc.flows.root
    // form + script gone from root, replaced by one subflow node
    expect(root.nodes.some((n) => n.id === 'demo-form')).toBe(false)
    const sub = root.nodes.find((n) => n.data.nodeType === 'subflow')!
    expect(sub).toBeDefined()
    // inner flow holds the two nodes + their internal edge
    const innerFlow = st.doc.flows[sub.data.subFlowId!]
    expect(innerFlow.nodes.map((n) => n.id).sort()).toEqual(['demo-form', 'demo-script'])
    expect(innerFlow.edges.some((e) => e.id === 'demo-e2')).toBe(true)
    // crossing edges now touch the group node (start→group, group→end)
    expect(root.edges.some((e) => e.source === 'demo-start' && e.target === sub.id)).toBe(true)
    expect(root.edges.some((e) => e.source === sub.id && e.target === 'demo-end')).toBe(true)
  })

  it('simulation follows only the matching branch (expression-aware)', () => {
    // start → fetch(output {status:'paid'}) → condition(status=='paid') → paid/other
    const doc: WorkflowDoc = {
      schemaVersion: 1,
      settings: { name: 'sim', version: '1' },
      flows: {
        root: {
          settings: { direction: 'lr' },
          nodes: [
            { id: 's', type: 'start', position: { x: 0, y: 0 }, data: { label: 'S', nodeType: 'start', params: {} } },
            { id: 'f', type: 'data', position: { x: 0, y: 0 }, data: { label: 'F', nodeType: 'data', params: {}, simulatedOutput: { status: 'paid' } } },
            { id: 'c', type: 'condition', position: { x: 0, y: 0 }, data: { label: 'paid?', nodeType: 'condition', params: { expression: "status == 'paid'" } } },
            { id: 'paid', type: 'data', position: { x: 0, y: 0 }, data: { label: 'Paid', nodeType: 'data', params: {} } },
            { id: 'other', type: 'data', position: { x: 0, y: 0 }, data: { label: 'Other', nodeType: 'data', params: {} } },
          ],
          edges: [
            { id: '1', source: 's', target: 'f' },
            { id: '2', source: 'f', target: 'c' },
            { id: '3', source: 'c', sourceHandle: 'true', target: 'paid' },
            { id: '4', source: 'c', sourceHandle: 'false', target: 'other' },
          ],
        },
      },
    }
    reset(doc)
    const s = useWorkflowStore.getState()
    s.simReset()
    for (let i = 0; i < 6 && useWorkflowStore.getState().sim.status !== 'done'; i++) {
      useWorkflowStore.getState().simStep()
    }
    const sim = useWorkflowStore.getState().sim
    expect(sim.doneNodeIds).toContain('paid')
    expect(sim.doneNodeIds).not.toContain('other') // false branch skipped
  })

  it('openSubFlow pushes the active flow path and creates the inner flow', () => {
    const s = useWorkflowStore.getState()
    s.addNode('subflow', { x: 0, y: 0 })
    const subNode = active().nodes.at(-1)!
    s.openSubFlow(subNode.id)
    const st = useWorkflowStore.getState()
    expect(st.activeFlowPath.length).toBe(2)
    expect(st.doc.flows[subNode.data.subFlowId!]).toBeDefined()
  })

  it('selectAllNodes flags every node without marking the doc dirty', () => {
    const s = useWorkflowStore.getState()
    const rev = s.docRevision
    s.selectAllNodes()
    const st = useWorkflowStore.getState()
    expect(active().nodes.every((n) => n.selected)).toBe(true)
    expect(st.selectedNodeId).toBe(active().nodes[0].id)
    expect(st.dirty).toBe(false) // selection is not a document edit
    expect(st.docRevision).toBe(rev)
  })

  it('applyToSelectedNodes updates every selected node', () => {
    const s = useWorkflowStore.getState()
    s.selectAllNodes()
    s.applyToSelectedNodes({ icon: 'trophy' })
    expect(active().nodes.every((n) => n.data.icon === 'trophy')).toBe(true)
  })
})
