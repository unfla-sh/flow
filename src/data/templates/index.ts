import { showcaseTemplates } from './showcase'
import type { WorkflowTemplate } from './types'

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

export const templates: WorkflowTemplate[] = [...showcaseTemplates, ...privateTemplates]

export type { WorkflowTemplate }
