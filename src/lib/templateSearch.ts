import { getDiagramKit } from '@/data/diagramKits'
import type { WorkflowTemplate } from '@/data/templates'

/**
 * Free-text match for the template browser. Every word in the query has to
 * appear somewhere in the template's name, description, category or kit, so
 * "uml class" and "class uml" both find the same thing and a two-word query
 * narrows rather than widens.
 */
export function templateMatches(template: WorkflowTemplate, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const kit = getDiagramKit(template.doc.settings.diagramKind ?? 'workflow').label
  const haystack = [template.name, template.description, template.category ?? '', kit]
    .join(' ')
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/** Public path of a template's generated preview image. */
export function templateThumbnailUrl(id: string, base = import.meta.env.BASE_URL): string {
  return `${base}template-thumbs/${id}.webp`
}
