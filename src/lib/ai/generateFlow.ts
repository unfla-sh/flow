import { finalizeImportedDoc } from '@/lib/autoLayout'
import { parseWorkflowFile } from '@/lib/workflowFile'
import { normalizeCatalogDefinitionIds } from '@/data/nodeCatalog'
import type { WorkflowDoc } from '@/types/workflow'

import { FLOW_SCHEMA_PROMPT } from './flowSchemaPrompt'

const USER_PREAMBLE =
  'Build the most appropriate workflow or systems diagram for the following. Respond with ONLY the JSON document.\n\n'

/** System + user halves for a direct API call. */
export function buildGenerateMessages(description: string): { system: string; user: string } {
  return { system: FLOW_SCHEMA_PROMPT, user: `${USER_PREAMBLE}${description.trim()}` }
}

/** The full prompt (schema + request) to paste into any chat assistant. */
export function buildFullPrompt(description: string): string {
  const { system, user } = buildGenerateMessages(description)
  return `${system}\n\n${user}`
}

/** Parse a model's pasted text response into a validated, laid-out doc. */
export function parseGeneratedText(
  text: string,
): { ok: true; doc: WorkflowDoc } | { ok: false; error: string } {
  const parsed = parseWorkflowFile(extractJson(text))
  if (!parsed.ok) return { ok: false, error: parsed.error }
  return { ok: true, doc: normalizeCatalogDefinitionIds(finalizeImportedDoc(parsed.doc)) }
}

/** Pull a JSON object out of a model response that may wrap it in prose/fences. */
function extractJson(text: string): string {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*\n?([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first !== -1 && last > first) t = t.slice(first, last + 1)
  return t
}
