import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteWorkflow, listWorkflows, type WorkflowMeta } from '@/lib/persistence'

export function OpenWorkflowDialog({
  open,
  onOpenChange,
  onOpenWorkflow,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenWorkflow: (id: string) => void
}) {
  const [, setRefreshTick] = useState(0)
  const workflows: WorkflowMeta[] = open ? listWorkflows() : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open diagram</DialogTitle>
          <DialogDescription>Diagrams saved in this browser.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {workflows.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nothing saved yet — use File ▸ Save.
            </p>
          )}
          {workflows.map((meta) => (
            <div
              key={meta.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent"
            >
              <button
                className="flex-1 cursor-pointer text-left"
                onClick={() => onOpenWorkflow(meta.id)}
              >
                <div className="text-xs font-medium">{meta.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(meta.updatedAt).toLocaleString()}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${meta.name}`}
                onClick={() => {
                  deleteWorkflow(meta.id)
                  setRefreshTick((tick) => tick + 1)
                }}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
