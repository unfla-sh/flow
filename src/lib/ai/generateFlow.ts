import { finalizeImportedDoc } from '@/lib/autoLayout'
import { parseWorkflowFile } from '@/lib/workflowFile'
import type { WorkflowDoc } from '@/types/workflow'

import { FLOW_SCHEMA_PROMPT } from './flowSchemaPrompt'

const USER_PREAMBLE =
  'Build a workflow diagram for the following. Respond with ONLY the JSON document.\n\n'

/** The full prompt (schema + request) to paste into any chat assistant. */
export function buildFullPrompt(description: string): string {
  return `${FLOW_SCHEMA_PROMPT}\n\n${USER_PREAMBLE}${description.trim()}`
}

/** Parse a model's pasted text response into a validated, laid-out doc. */
export function parseGeneratedText(
  text: string,
): { ok: true; doc: WorkflowDoc } | { ok: false; error: string } {
  const parsed = parseWorkflowFile(extractJson(text))
  if (!parsed.ok) return { ok: false, error: parsed.error }
  return { ok: true, doc: finalizeImportedDoc(parsed.doc) }
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
