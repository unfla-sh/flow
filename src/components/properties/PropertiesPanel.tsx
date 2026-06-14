import { LockIcon } from 'lucide-react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSelectedEdge, useSelectedNode, useWorkflowStore } from '@/store/workflowStore'

import { EdgeInspector } from './EdgeInspector'
import { NodeInspector } from './NodeInspector'
import { WorkflowSettingsPanel } from './WorkflowSettingsPanel'

const NAV_KEYS = new Set([
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Escape',
])

export function PropertiesPanel() {
  const node = useSelectedNode()
  const edge = useSelectedEdge()
  const presentationMode = useWorkflowStore((state) => state.presentationMode)

  const title = node ? 'Node' : edge ? 'Edge' : 'Workflow'

  // Block keystrokes that would edit a focused field while read-only, but keep
  // navigation and copy (Ctrl/Cmd) working so the panel stays inspectable.
  const blockEditKeys = (event: ReactKeyboardEvent) => {
    if (!presentationMode) return
    const target = event.target as HTMLElement
    const editable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    if (!editable) return
    if (event.ctrlKey || event.metaKey || NAV_KEYS.has(event.key)) return
    event.preventDefault()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-xs font-semibold">{title} properties</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {node
              ? node.data.label
              : edge
                ? `${edge.source} → ${edge.target}`
                : 'Nothing selected — global settings'}
          </div>
        </div>
        {presentationMode && (
          <Badge variant="outline" className="shrink-0 gap-1">
            <LockIcon className="size-2.5" />
            Read-only
          </Badge>
        )}
      </div>
      <ScrollArea className="flex-1">
        {/* In presentation mode the panel stays inspectable (tabs + scroll work)
            while editing controls are made inert via `data-readonly` CSS. */}
        <div
          className="p-3"
          data-readonly={presentationMode ? 'true' : undefined}
          onKeyDownCapture={blockEditKeys}
        >
          {node ? (
            <NodeInspector key={node.id} node={node} />
          ) : edge ? (
            <EdgeInspector key={edge.id} edge={edge} />
          ) : (
            <WorkflowSettingsPanel />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
