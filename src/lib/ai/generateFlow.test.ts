import { describe, expect, it } from 'vitest'

import { diagramKits } from '@/data/diagramKits'
import { nodeCatalog, normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import { showcaseTemplates } from '@/data/templates/showcase'
import { scenarioKitTemplates } from '@/data/templates/scenarioKits'
import { serializeDoc } from '@/lib/workflowFile'

import { FLOW_SCHEMA_PROMPT } from './flowSchemaPrompt'
import { buildFullPrompt, parseGeneratedText } from './generateFlow'

describe('AI diagram generation contract', () => {
  it('documents every diagram kit and palette definition', () => {
    for (const kit of diagramKits) expect(FLOW_SCHEMA_PROMPT).toContain(`"${kit.id}"`)
    for (const entry of nodeCatalog) expect(FLOW_SCHEMA_PROMPT, entry.id).toContain(`"${entry.id}"`)
  })

  it('covers every construct used by the bundled templates', () => {
    const templates = [...scenarioKitTemplates, ...showcaseTemplates]
    for (const template of templates) {
      const doc = normalizeCatalogDefinitionIds(template.doc)
      expect(FLOW_SCHEMA_PROMPT).toContain(`"${doc.settings.diagramKind ?? 'workflow'}"`)
      for (const graph of Object.values(doc.flows)) {
        for (const node of graph.nodes) {
          expect(FLOW_SCHEMA_PROMPT, `${template.id}:${node.data.nodeType}`).toContain(
            `"${node.data.nodeType}"`,
          )
          expect(FLOW_SCHEMA_PROMPT, `${template.id}:${node.data.definitionId}`).toContain(
            `"${node.data.definitionId}"`,
          )
          for (const key of Object.keys(node.data.params)) {
            expect(FLOW_SCHEMA_PROMPT, `${template.id}:params.${key}`).toContain(key)
          }
        }
        for (const edge of graph.edges) {
          if (edge.data?.kind) expect(FLOW_SCHEMA_PROMPT).toContain(`"${edge.data.kind}"`)
          if (edge.data?.sourceCardinality) {
            expect(FLOW_SCHEMA_PROMPT).toContain(`"${edge.data.sourceCardinality}"`)
          }
          if (edge.data?.targetCardinality) {
            expect(FLOW_SCHEMA_PROMPT).toContain(`"${edge.data.targetCardinality}"`)
          }
          if (edge.data?.style?.pathType) {
            expect(FLOW_SCHEMA_PROMPT).toContain(`"${edge.data.style.pathType}"`)
          }
          if (edge.data?.style?.lineStyle) {
            expect(FLOW_SCHEMA_PROMPT).toContain(`"${edge.data.style.lineStyle}"`)
          }
        }
      }
    }
  })

  it('parses fenced AI responses shaped like each specialized template', () => {
    for (const template of scenarioKitTemplates) {
      const response = `Here is the diagram:\n\n\`\`\`json\n${serializeDoc(template.doc)}\n\`\`\``
      const result = parseGeneratedText(response)
      expect(result.ok, template.id).toBe(true)
      if (!result.ok) continue
      expect(result.doc.settings.diagramKind).toBe(template.doc.settings.diagramKind)
      expect(result.doc.flows.root.nodes.length).toBe(template.doc.flows.root.nodes.length)
      expect(result.doc.flows.root.nodes.every((node) => node.data.definitionId)).toBe(true)
    }
  })

  it('combines the schema contract with the user request', () => {
    const request = 'An organization chart with a CEO and two department heads'
    const prompt = buildFullPrompt(request)
    expect(prompt).toContain(FLOW_SCHEMA_PROMPT)
    expect(prompt).toContain(request)
  })
})
