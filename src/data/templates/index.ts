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

const bundledTemplates: WorkflowTemplate[] = [
  ...scenarioKitTemplates,
  ...showcaseTemplates,
  ...privateTemplates,
]

export const templates: WorkflowTemplate[] = bundledTemplates.map((template) => ({
  ...template,
  doc: normalizeCatalogDefinitionIds(template.doc),
}))

export type { WorkflowTemplate }
