import { SearchIcon, StarIcon } from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'

import { DND_MIME_TYPE } from '@/components/canvas/FlowCanvas'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NODE_CATEGORIES, getCatalogEntry, nodeCatalog, type NodeCatalogEntry } from '@/data/nodeCatalog'
import { getFavorites, toggleFavorite } from '@/lib/palettePrefs'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/store/workflowStore'

function PaletteItem({
  entry,
  favorite,
  onToggleFavorite,
}: {
  entry: NodeCatalogEntry
  favorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(DND_MIME_TYPE, entry.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  const Icon = entry.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable
          onDragStart={onDragStart}
          className="group flex cursor-grab items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm shadow-xs transition-colors hover:bg-accent active:cursor-grabbing"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-xs font-medium">{entry.label}</span>
          <button
            type="button"
            aria-label={favorite ? `Unfavorite ${entry.label}` : `Favorite ${entry.label}`}
            className={cn(
              'shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-amber-500',
              favorite ? 'text-amber-500 opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(entry.id)
            }}
          >
            <StarIcon className={cn('size-3.5', favorite && 'fill-amber-500')} />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">{entry.description}</TooltipContent>
    </Tooltip>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

export function NodePalette() {
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites())
  const recentIds = useWorkflowStore((state) => state.recentCatalogIds)

  const onToggleFavorite = (id: string) => setFavorites(toggleFavorite(id))

  const itemProps = (entry: NodeCatalogEntry) => ({
    entry,
    favorite: favorites.includes(entry.id),
    onToggleFavorite,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return nodeCatalog
    return nodeCatalog.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q),
    )
  }, [query])

  const searching = query.trim().length > 0
  const favoriteEntries = favorites.map(getCatalogEntry).filter(Boolean) as NodeCatalogEntry[]
  const recentEntries = recentIds.map(getCatalogEntry).filter(Boolean) as NodeCatalogEntry[]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search nodes…"
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {!searching && favoriteEntries.length > 0 && (
            <Section title="★ Favorites">
              {favoriteEntries.map((entry) => (
                <PaletteItem key={`fav-${entry.id}`} {...itemProps(entry)} />
              ))}
            </Section>
          )}
          {!searching && recentEntries.length > 0 && (
            <Section title="Recently used">
              {recentEntries.map((entry) => (
                <PaletteItem key={`recent-${entry.id}`} {...itemProps(entry)} />
              ))}
            </Section>
          )}
          {NODE_CATEGORIES.map((category) => {
            const entries = filtered.filter((entry) => entry.category === category)
            if (entries.length === 0) return null
            return (
              <Section key={category} title={category}>
                {entries.map((entry) => (
                  <PaletteItem key={entry.id} {...itemProps(entry)} />
                ))}
              </Section>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No nodes match “{query}”.
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3 text-[10px] text-muted-foreground">
        Drag a node onto the canvas to add it.
      </div>
    </div>
  )
}
