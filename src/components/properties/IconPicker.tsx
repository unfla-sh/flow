import { ChevronDownIcon, RotateCcwIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ICON_GROUPS, NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

/** Pastel + bold presets for the icon-chip background. */
const BG_SWATCHES = [
  '#e2e8f0', '#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#99f6e4',
  '#bae6fd', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#2563eb', '#16a34a',
]

export function IconPicker({
  value,
  fallbackName,
  iconBg,
  onChange,
  onIconBgChange,
}: {
  value: string | undefined
  /** Shown when no override is set (the node type's default icon name). */
  fallbackName: string
  iconBg: string | undefined
  onChange: (icon: string | undefined) => void
  onIconBgChange: (iconBg: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return ICON_GROUPS.flatMap((g) => g.icons).filter((i) => i.name.includes(q))
  }, [query])

  const iconButton = ({ name, icon: Icon }: (typeof ICON_GROUPS)[number]['icons'][number]) => (
    <button
      key={name}
      title={name}
      className={cn(
        'flex size-7 cursor-pointer items-center justify-center rounded-sm hover:bg-accent',
        value === name && 'bg-primary text-primary-foreground hover:bg-primary',
      )}
      onClick={() => onChange(name)}
    >
      <Icon className="size-4" />
    </button>
  )

  return (
    <div className="space-y-1.5">
      <Label>Icon</Label>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between font-normal">
            <span className="flex items-center gap-2">
              <span
                className="flex size-5 items-center justify-center rounded"
                style={iconBg ? { backgroundColor: iconBg } : undefined}
              >
                <NodeIcon name={value} className="size-3.5" />
              </span>
              {value ?? `Default (${fallbackName})`}
            </span>
            <ChevronDownIcon className="size-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 p-2" align="start">
          <div className="relative mb-2">
            <SearchIcon className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons…"
              className="h-7 pl-7 text-xs"
            />
          </div>

          <button
            className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-xs hover:bg-accent"
            onClick={() => onChange(undefined)}
          >
            <RotateCcwIcon className="size-3.5 text-muted-foreground" />
            Use type default
          </button>

          <div className="max-h-56 overflow-y-auto pr-1">
            {matches ? (
              matches.length > 0 ? (
                <div className="grid grid-cols-7 gap-0.5">
                  {matches.map(iconButton)}
                </div>
              ) : (
                <p className="px-2 py-3 text-center text-[10px] text-muted-foreground">
                  No icons match “{query}”.
                </p>
              )
            ) : (
              ICON_GROUPS.map((group) => (
                <div key={group.label} className="mb-1.5">
                  <div className="px-1 pb-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {group.icons.map(iconButton)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-2 border-t pt-2">
            <div className="px-1 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Background
            </div>
            <div className="flex flex-wrap items-center gap-1 px-1">
              <button
                title="Default"
                onClick={() => onIconBgChange(undefined)}
                className={cn(
                  'flex size-6 cursor-pointer items-center justify-center rounded border text-muted-foreground hover:bg-accent',
                  !iconBg && 'ring-2 ring-ring',
                )}
              >
                <RotateCcwIcon className="size-3" />
              </button>
              {BG_SWATCHES.map((color) => (
                <button
                  key={color}
                  title={color}
                  onClick={() => onIconBgChange(color)}
                  style={{ backgroundColor: color }}
                  className={cn(
                    'size-6 cursor-pointer rounded border',
                    iconBg?.toLowerCase() === color && 'ring-2 ring-ring',
                  )}
                />
              ))}
              <label
                title="Custom colour"
                className="relative flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded border bg-gradient-to-br from-pink-400 via-amber-300 to-sky-400"
              >
                <input
                  type="color"
                  value={iconBg ?? '#bae6fd'}
                  onChange={(e) => onIconBgChange(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
