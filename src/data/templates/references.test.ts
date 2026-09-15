import { beforeEach, describe, expect, it } from 'vitest'

import { normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import { validateFlow } from '@/lib/validateFlow'
import { useWorkflowStore } from '@/store/workflowStore'

import { referenceTemplates } from './references'

const commerce = referenceTemplates.find((t) => t.id === 'ref-commerce-agent')!
const codeboarding = referenceTemplates.find((t) => t.id === 'ref-codeboarding-pipeline')!

/** Run the simulator on the active flow to completion and return the visited node ids. */
function runSimulation(): string[] {
  const store = useWorkflowStore.getState()
  store.simReset()
  for (let i = 0; i < 50 && useWorkflowStore.getState().sim.status !== 'done'; i += 1) {
    useWorkflowStore.getState().simStep()
  }
  const { sim } = useWorkflowStore.getState()
  expect(sim.status).toBe('done')
  return sim.doneNodeIds
}

describe('reference templates', () => {
  beforeEach(() => {
    useWorkflowStore.getState().simStop()
  })

  it('validate without errors', () => {
    for (const template of referenceTemplates) {
      const doc = normalizeCatalogDefinitionIds(template.doc)
      for (const [flowId, graph] of Object.entries(doc.flows)) {
        const errors = validateFlow(graph, doc.settings.diagramKind).filter((i) => i.severity === 'error')
        expect(errors, `${template.id}:${flowId}`).toEqual([])
      }
    }
  })

  it('commerce agent: the switch follows the branch the model call reports', () => {
    useWorkflowStore.getState().loadDoc(commerce.doc)
    const visited = runSimulation()
    // Default sample output is a write tool call: the human-approval path runs…
    expect(visited).toEqual(expect.arrayContaining(['start', 'assemble', 'model', 'emit', 'validate-w', 'approve', 'apply']))
    // …and the other three branches stay idle.
    expect(visited).not.toContain('dispatch')
    expect(visited).not.toContain('validate-p')
    expect(visited).not.toContain('turn-ends')
  })

  it('commerce agent: changing the model call output steers the simulation', () => {
    useWorkflowStore.getState().loadDoc(commerce.doc)
    useWorkflowStore.getState().updateNodeData('model', { simulatedOutput: { emitted: 'final_text' } })
    const visited = runSimulation()
    expect(visited).toEqual(expect.arrayContaining(['turn-ends', 'memory', 'facts', 'end']))
    expect(visited).not.toContain('approve')

    useWorkflowStore.getState().updateNodeData('model', { simulatedOutput: { emitted: 'read_tool_call' } })
    const read = runSimulation()
    expect(read).toEqual(expect.arrayContaining(['dispatch', 'backend', 'sanitize']))
    expect(read).not.toContain('validate-w')
  })

  it('commerce agent: an unknown output falls back to every branch', () => {
    useWorkflowStore.getState().loadDoc(commerce.doc)
    useWorkflowStore.getState().updateNodeData('model', { simulatedOutput: { emitted: 'something_else' } })
    const visited = runSimulation()
    expect(visited).toEqual(expect.arrayContaining(['dispatch', 'validate-w', 'validate-p', 'turn-ends']))
  })

  it('codeboarding: the root fans out from the pipeline and the sub-flow runs on its own', () => {
    useWorkflowStore.getState().loadDoc(codeboarding.doc)
    const root = runSimulation()
    expect(root).toEqual(
      expect.arrayContaining(['cli', 'pipeline', 'health', 'static', 'agents', 'entrypoints', 'monitoring', 'renderers', 'out']),
    )

    useWorkflowStore.getState().openSubFlow('pipeline')
    expect(useWorkflowStore.getState().activeFlowPath).toEqual(['root', 'pipeline'])
    const inner = runSimulation()
    expect(inner).toEqual(expect.arrayContaining(['context', 'orchestration', 'incremental', 'scope', 'indexing']))
  })
})
