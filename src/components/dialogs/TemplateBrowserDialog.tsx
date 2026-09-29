import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getDiagramKit } from '@/data/diagramKits'
import { templateCategories, templates, type WorkflowTemplate } from '@/data/templates'
import { templateMatches as matches, templateThumbnailUrl } from '@/lib/templateSearch'
import { cn } from '@/lib/utils'

const ALL = 'All'

function TemplateCard({
  template,
  onSelect,
}: {
  template: WorkflowTemplate
  onSelect: (template: WorkflowTemplate) => void
}) {
  const [failed, setFailed] = useState(false)
  const kit = getDiagramKit(template.doc.settings.diagramKind ?? 'workflow')

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex aspect-[8/5] items-center justify-center overflow-hidden border-b bg-white">
        {failed ? (
          <span className="text-[10px] text-muted-foreground">No preview</span>
        ) : (
          <img
            src={templateThumbnailUrl(template.id)}
            alt=""
            loading="lazy"
            className="size-full object-contain transition-transform group-hover:scale-[1.03]"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold leading-tight">{template.name}</span>
          <Badge variant="secondary" className="shrink-0">
            {kit.label}
          </Badge>
        </div>
        <p className="line-clamp-3 text-[11px] leading-snug text-muted-foreground">
          {template.description}
        </p>
      </div>
    </button>
  )
}

export function TemplateBrowserDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the chosen template; the caller guards unsaved changes. */
  onSelect: (template: WorkflowTemplate) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)

  const visible = useMemo(() => {
    const pool = category === ALL ? templates : (templateCategories.find((group) => group.category === category)?.templates ?? [])
    return pool.filter((template) => matches(template, query))
  }, [category, query])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const group of templateCategories) {
      map.set(group.category, group.templates.filter((template) => matches(template, query)).length)
    }
    return map
  }, [query])

  const choose = (template: WorkflowTemplate) => {
    setQuery('')
    onOpenChange(false)
    onSelect(template)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(46rem,88vh)] max-w-5xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle>New from template</DialogTitle>
          <DialogDescription>
            Every template is ordinary nodes and edges — open one and edit it however you like.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && visible.length > 0) choose(visible[0])
            }}
            placeholder="Search templates — try “uml”, “kanban”, or “data”"
            className="pl-8"
            aria-label="Search templates"
          />
        </div>

        <div className="flex min-h-0 flex-1 gap-4">
          <nav className="w-40 shrink-0 space-y-0.5 overflow-y-auto pr-1">
            {[{ category: ALL, count: templates.filter((t) => matches(t, query)).length }, ...templateCategories.map((group) => ({ category: group.category, count: counts.get(group.category) ?? 0 }))].map(
              (item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => setCategory(item.category)}
                  disabled={item.count === 0}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    category === item.category
                      ? 'bg-secondary font-semibold text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    item.count === 0 && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                  )}
                >
                  <span className="truncate">{item.category}</span>
                  <span className="shrink-0 tabular-nums text-[10px]">{item.count}</span>
                </button>
              ),
            )}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {visible.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">
                Nothing matches “{query}”.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {visible.map((template) => (
                  <TemplateCard key={template.id} template={template} onSelect={choose} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
