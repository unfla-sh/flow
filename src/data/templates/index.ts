import { diagramTypeTemplates } from './diagramTypes'
import { referenceTemplates } from './references'
import { showcaseTemplates } from './showcase'
import { scenarioKitTemplates } from './scenarioKits'
import type { WorkflowTemplate } from './types'
import { normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'

/**
 * Private templates live in ./private/*.templates.ts, which is git-ignored —
 * they ship locally but are never pushed to a public repo. On a fresh clone
 * the glob is simply empty, so only the safe showcase templates appear.
 */
const privateModules = import.meta.glob<{ templates?: WorkflowTemplate[] }>(
  './private/*.templates.ts',
  { eager: true },
)
const privateTemplates = Object.values(privateModules).flatMap((m) => m.templates ?? [])

const withCategory = (list: WorkflowTemplate[], category: string) =>
  list.map((template) => ({ ...template, category: template.category ?? category }))

const bundledTemplates: WorkflowTemplate[] = [
  ...diagramTypeTemplates,
  ...withCategory(scenarioKitTemplates, 'Starter kits'),
  ...withCategory(showcaseTemplates, 'Feature tours'),
  ...withCategory(referenceTemplates, 'References'),
  ...withCategory(privateTemplates, 'Private'),
]

/** Template categories in menu order, each with its templates. */
export const templateCategories: { category: string; templates: WorkflowTemplate[] }[] = []

export const templates: WorkflowTemplate[] = bundledTemplates.map((template) => ({
  ...template,
  doc: normalizeCatalogDefinitionIds(template.doc),
}))

for (const template of templates) {
  const category = template.category ?? 'Other'
  const group = templateCategories.find((item) => item.category === category)
  if (group) group.templates.push(template)
  else templateCategories.push({ category, templates: [template] })
}

export type { WorkflowTemplate }
