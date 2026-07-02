import type { XYPosition } from '@xyflow/react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { nodeCatalog } from '@/data/nodeCatalog'
import { cn } from '@/lib/utils'
import { useWorkflowStore, type PendingConnection } from '@/store/workflowStore'

export interface ContextMenuState {
  kind: 'node' | 'edge' | 'pane'
  targetId?: string
  /** Position inside the canvas wrapper, for the menu itself. */
  x: number
  y: number
  /** Position in flow coordinates, for paste/add placement. */
  flowPosition: XYPosition
  /** Whether the node target is a sub-flow node. */
  isSubflow?: boolean
  /** Set when a connection drag was dropped on the pane: picking a node wires it up. */
  pendingConnection?: PendingConnection
}

function MenuItem({
  children,
  onSelect,
  disabled,
  destructive,
}: {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        destructive && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
      )}
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </button>
  )
}

export function CanvasContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState
  onClose: () => void
}) {
  const [view, setView] = useState<'main' | 'replace' | 'add'>(
    menu.pendingConnection ? 'add' : 'main',
  )
  const store = useWorkflowStore

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }

  const catalogList = (onPick: (catalogId: string) => void, header?: ReactNode) => (
    <>
      {header ?? (
        <MenuItem onSelect={() => setView('main')}>
          <ChevronLeftIcon className="size-3.5" /> Back
        </MenuItem>
      )}
      <div className="-mx-1 my-1 h-px bg-border" />
      {nodeCatalog.map((entry) => {
        const Icon = entry.icon
        return (
          <MenuItem key={entry.id} onSelect={run(() => onPick(entry.id))}>
            <Icon className="size-3.5 text-muted-foreground" /> {entry.label}
          </MenuItem>
        )
      })}
    </>
  )

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        className="absolute z-50 w-52 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        style={{ left: menu.x, top: menu.y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {view === 'replace' && menu.targetId
          ? catalogList((catalogId) => store.getState().replaceNodeType(menu.targetId!, catalogId))
          : view === 'add'
            ? catalogList(
                (catalogId) =>
                  store
                    .getState()
                    .addNode(catalogId, menu.flowPosition, menu.pendingConnection),
                menu.pendingConnection ? (
                  <div className="px-2 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Add &amp; connect
                  </div>
                ) : undefined,
              )
            : menu.kind === 'node'
              ? (
                <>
                  {menu.isSubflow && (
                    <MenuItem onSelect={run(() => store.getState().openSubFlow(menu.targetId!))}>
                      Open sub-flow
                    </MenuItem>
                  )}
                  <MenuItem onSelect={run(() => store.getState().copySelection())}>
                    Copy <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+C</span>
                  </MenuItem>
                  <MenuItem onSelect={run(() => store.getState().cutSelection())}>
                    Cut <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+X</span>
                  </MenuItem>
                  <MenuItem onSelect={run(() => store.getState().duplicateSelected())}>
                    Duplicate <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+D</span>
                  </MenuItem>
                  <MenuItem onSelect={() => setView('replace')}>
                    Replace with… <ChevronRightIcon className="ml-auto size-3.5" />
                  </MenuItem>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <MenuItem destructive onSelect={run(() => store.getState().deleteSelected())}>
                    Delete <span className="ml-auto text-[10px] opacity-70">Del</span>
                  </MenuItem>
                </>
              )
              : menu.kind === 'edge'
                ? (
                  <>
                    <MenuItem onSelect={run(() => store.getState().setSelectedEdge(menu.targetId!))}>
                      Edit properties
                    </MenuItem>
                    <MenuItem onSelect={run(() => store.getState().toggleEdgeTwoWay(menu.targetId!))}>
                      Toggle two-way arrow ⇄
                    </MenuItem>
                    <MenuItem
                      onSelect={run(() => store.getState().simplifyToTwoWayEdge(menu.targetId!))}
                    >
                      Merge opposite edges
                    </MenuItem>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <MenuItem destructive onSelect={run(() => store.getState().deleteEdge(menu.targetId!))}>
                      Delete edge
                    </MenuItem>
                  </>
                )
                : (
                  <>
                    <MenuItem
                      disabled={store.getState().clipboard === null}
                      onSelect={run(() => store.getState().paste(menu.flowPosition))}
                    >
                      Paste here <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+V</span>
                    </MenuItem>
                    <MenuItem onSelect={() => setView('add')}>
                      Add node… <ChevronRightIcon className="ml-auto size-3.5" />
                    </MenuItem>
                  </>
                )}
      </div>
    </>
  )
}
