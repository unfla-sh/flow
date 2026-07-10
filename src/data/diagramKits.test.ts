import { describe, expect, it } from 'vitest'

import { workflowNodeTypes } from '@/components/canvas/workflowNodeTypes'
import { parseWorkflowFile, serializeDoc } from '@/lib/workflowFile'
import { SWITCH_DEFAULT_HANDLE } from '@/types/workflow'
import {
  catalogEntriesForKit,
  getCatalogEntry,
  nodeCatalog,
  normalizeCatalogDefinitionIds,
} from './nodeCatalog'
import { edgeDefaultsForKit } from './diagramKits'
import { showcaseTemplates } from './templates/showcase'
import { scenarioKitTemplates } from './templates/scenarioKits'

const SIDE_HANDLES = new Set(['top', 'right', 'bottom', 'left'])

function hasTemplateHandle(
  node: (typeof scenarioKitTemplates)[number]['doc']['flows'][string]['nodes'][number],
  handle: string | null | undefined,
): boolean {
  if (!handle || handle === 'in' || SIDE_HANDLES.has(handle)) return true
  if (node.data.nodeType === 'condition' || node.data.nodeType === 'decision') {
    return handle === 'true' || handle === 'false'
  }
  if (node.data.nodeType === 'switch') {
    return handle === SWITCH_DEFAULT_HANDLE || (node.data.cases ?? []).some((item) => item.id === handle)
  }
  if (node.data.nodeType === 'record') {
    const match = handle.match(/^field:(.+):(left|right)$/)
    return Boolean(match && (node.data.fields ?? []).some((field) => field.id === match[1]))
  }
  return false
}

describe('diagram kits', () => {
  it('filters the palette to domain definitions plus shared annotations', () => {
    const organization = catalogEntriesForKit('organization').map((entry) => entry.id)
    expect(organization).toContain('org.person')
    expect(organization).toContain('note')
    expect(organization).not.toContain('database.table')
  })

  it('provides semantic connection defaults', () => {
    expect(edgeDefaultsForKit('organization').kind).toBe('reporting')
    expect(edgeDefaultsForKit('database').targetCardinality).toBe('many')
    expect(edgeDefaultsForKit('infrastructure').kind).toBe('network')
  })

  it('ships valid starter documents for every specialized kit', () => {
    expect(scenarioKitTemplates).toHaveLength(4)
    for (const template of scenarioKitTemplates) {
      const result = parseWorkflowFile(serializeDoc(template.doc))
      expect(result.ok, template.id).toBe(true)
    }
  })

  it('has a canvas renderer for every palette component', () => {
    for (const entry of nodeCatalog) {
      expect(workflowNodeTypes[entry.nodeType], entry.id).toBeDefined()
    }
  })

  it('can recreate every bundled template from registered palette components', () => {
    const publicTemplates = [...scenarioKitTemplates, ...showcaseTemplates]
    for (const template of publicTemplates) {
      const doc = normalizeCatalogDefinitionIds(template.doc)
      for (const graph of Object.values(doc.flows)) {
        const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
        for (const node of graph.nodes) {
          expect(workflowNodeTypes[node.data.nodeType], `${template.id}:${node.id}`).toBeDefined()
          expect(node.data.definitionId, `${template.id}:${node.id}`).toBeTruthy()
          const definition = getCatalogEntry(node.data.definitionId!)
          expect(definition, `${template.id}:${node.id}:${node.data.definitionId}`).toBeDefined()
          expect(definition?.nodeType).toBe(node.data.nodeType)
        }
        for (const edge of graph.edges) {
          const source = nodes.get(edge.source)
          const target = nodes.get(edge.target)
          expect(source, `${template.id}:${edge.id}:source`).toBeDefined()
          expect(target, `${template.id}:${edge.id}:target`).toBeDefined()
          expect(hasTemplateHandle(source!, edge.sourceHandle), `${template.id}:${edge.id}:sourceHandle`).toBe(true)
          expect(hasTemplateHandle(target!, edge.targetHandle), `${template.id}:${edge.id}:targetHandle`).toBe(true)
        }
      }
    }
  })
})
