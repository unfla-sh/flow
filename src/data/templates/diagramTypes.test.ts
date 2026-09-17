import { describe, expect, it } from 'vitest'

import { catalogEntriesForKit, normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import { diagramKits } from '@/data/diagramKits'
import { parseWorkflowFile, serializeDoc } from '@/lib/workflowFile'
import { validateFlow } from '@/lib/validateFlow'

import { diagramTypeTemplates } from './diagramTypes'
import { templateCategories, templates } from './index'

describe('diagram type templates', () => {
  it('cover twenty diagram types with unique ids and names', () => {
    expect(diagramTypeTemplates).toHaveLength(20)
    expect(new Set(diagramTypeTemplates.map((t) => t.id)).size).toBe(20)
    expect(new Set(diagramTypeTemplates.map((t) => t.name)).size).toBe(20)
  })

  it('round-trip through the file format and validate without errors', () => {
    for (const template of diagramTypeTemplates) {
      const parsed = parseWorkflowFile(serializeDoc(template.doc))
      expect(parsed.ok, template.id).toBe(true)
      const doc = normalizeCatalogDefinitionIds(template.doc)
      for (const [flowId, graph] of Object.entries(doc.flows)) {
        const errors = validateFlow(graph, doc.settings.diagramKind).filter((i) => i.severity === 'error')
        expect(errors, `${template.id}:${flowId}`).toEqual([])
      }
    }
  })

  it('only use palette definitions available in their own kit', () => {
    for (const template of diagramTypeTemplates) {
      const kind = template.doc.settings.diagramKind ?? 'workflow'
      const allowed = new Set(catalogEntriesForKit(kind).map((entry) => entry.id))
      for (const node of template.doc.flows.root.nodes) {
        expect(allowed.has(node.data.definitionId!), `${template.id}:${node.id}:${node.data.definitionId}`).toBe(true)
      }
    }
  })

  it('keep frames as backdrops with explicit bounds', () => {
    for (const template of diagramTypeTemplates) {
      for (const node of template.doc.flows.root.nodes) {
        if (node.data.nodeType !== 'frame') continue
        expect(node.width, `${template.id}:${node.id}`).toBeGreaterThan(0)
        expect(node.height, `${template.id}:${node.id}`).toBeGreaterThan(0)
        expect(node.zIndex).toBe(-1)
      }
      const frameIds = new Set(template.doc.flows.root.nodes.filter((n) => n.data.nodeType === 'frame').map((n) => n.id))
      for (const edge of template.doc.flows.root.edges) {
        expect(frameIds.has(edge.source) || frameIds.has(edge.target), `${template.id}:${edge.id}`).toBe(false)
      }
    }
  })

  it('every kit has at least one template and the menu groups them', () => {
    for (const kit of diagramKits) {
      expect(templates.some((t) => (t.doc.settings.diagramKind ?? 'workflow') === kit.id), kit.id).toBe(true)
    }
    expect(templateCategories.map((g) => g.category)).toEqual(
      expect.arrayContaining(['Structure', 'Hierarchy', 'Flow & process', 'Data architecture', 'Starter kits', 'Feature tours', 'References']),
    )
  })
})
