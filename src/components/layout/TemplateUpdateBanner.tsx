import { RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { templates } from '@/data/templates'
import { loadTemplate } from '@/lib/persistence'
import { useWorkflowStore } from '@/store/workflowStore'

/**
 * Floating notice shown when the open document came from a bundled template
 * that has since been updated in a newer release. Matches by the provenance
 * stamp (doc.meta.templateId), falling back to the template's name for
 * documents created before stamping existed. "Load new version" replaces the
 * current document with a fresh copy of the updated template.
 */
export function TemplateUpdateBanner() {
  const doc = useWorkflowStore((state) => state.doc)
  const presentationMode = useWorkflowStore((state) => state.presentationMode)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const template =
    templates.find((t) => t.id === doc.meta?.templateId) ??
    templates.find((t) => t.doc.settings.name === doc.settings.name)
  if (!template || presentationMode) return null

  const loadedVersion = doc.meta?.templateVersion ?? doc.settings.version
  const bundledVersion = template.doc.settings.version
  const key = `${template.id}@${bundledVersion}`
  if (loadedVersion === bundledVersion || dismissed === key) return null

  return (
    <div className="absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-md">
      <p className="min-w-0 text-xs">
        The template <span className="font-semibold">“{template.name}”</span> has been updated (v
        {loadedVersion} → v{bundledVersion}).
      </p>
      <Button size="sm" className="shrink-0" onClick={() => loadTemplate(template)}>
        <RefreshCw className="size-3.5" /> Load new version
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label="Dismiss"
        title="Keep this copy"
        onClick={() => setDismissed(key)}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
