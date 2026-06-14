import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { issueCounts, validateFlow, type FlowIssue } from '@/lib/validateFlow'
import { cn } from '@/lib/utils'
import { useActiveFlow, useWorkflowStore } from '@/store/workflowStore'

function SeverityIcon({ severity }: { severity: FlowIssue['severity'] }) {
  if (severity === 'error') return <CircleAlertIcon className="size-3.5 text-destructive" />
  if (severity === 'warning') return <TriangleAlertIcon className="size-3.5 text-amber-500" />
  return <InfoIcon className="size-3.5 text-muted-foreground" />
}

export function ValidationMenu() {
  const graph = useActiveFlow()
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode)

  const issues = useMemo(() => validateFlow(graph), [graph])
  const counts = issueCounts(issues)
  const total = issues.length
  const tone =
    counts.error > 0 ? 'text-destructive' : counts.warning > 0 ? 'text-amber-500' : 'text-emerald-600'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1.5', tone)} aria-label="Validation issues">
          {total === 0 ? (
            <CircleCheckIcon className="size-4" />
          ) : (
            <TriangleAlertIcon className="size-4" />
          )}
          {total > 0 && <span className="text-xs tabular-nums">{total}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-80 overflow-y-auto p-2">
        {total === 0 ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <CircleCheckIcon className="size-4 text-emerald-600" />
            No problems found in this flow.
          </div>
        ) : (
          <>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {counts.error > 0 && `${counts.error} error${counts.error > 1 ? 's' : ''} · `}
              {counts.warning > 0 && `${counts.warning} warning${counts.warning > 1 ? 's' : ''} · `}
              {counts.info} info
            </div>
            <div className="space-y-0.5">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  disabled={!issue.nodeId}
                  onClick={() => issue.nodeId && setSelectedNode(issue.nodeId)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-xs',
                    issue.nodeId ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    <SeverityIcon severity={issue.severity} />
                  </span>
                  <span className="leading-snug">{issue.message}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
