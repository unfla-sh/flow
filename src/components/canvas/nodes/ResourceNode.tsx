import type { NodeProps } from '@xyflow/react'
import { Server } from 'lucide-react'

import { resolveNodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

function statusTone(status: string): string {
  const value = status.toLowerCase()
  if (value.includes('down') || value.includes('error') || value.includes('critical')) {
    return 'bg-red-500'
  }
  if (value.includes('warn') || value.includes('degraded')) return 'bg-amber-500'
  if (value.includes('healthy') || value.includes('ready') || value.includes('active')) {
    return 'bg-emerald-500'
  }
  return 'bg-muted-foreground/50'
}

export function ResourceNode({ data, selected }: NodeProps<WorkflowNode>) {
  const resourceType = String(data.params.resourceType ?? '')
  const environment = String(data.params.environment ?? '')
  const status = String(data.params.status ?? '')

  return (
    <BaseNode
      icon={resolveNodeIcon(data.icon, Server)}
      label={data.label}
      description={resourceType || data.description}
      selected={selected}
      style={data.style}
      accentClassName="bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300"
    >
      {(environment || status || (data.attributes?.length ?? 0) > 0) && (
        <div className="space-y-1.5 px-3 py-2">
          {(environment || status) && (
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              {status && <span className={cn('size-1.5 shrink-0 rounded-full', statusTone(status))} />}
              {status && <span className="truncate">{status}</span>}
              {environment && <span className="ml-auto truncate rounded bg-muted px-1.5 py-0.5">{environment}</span>}
            </div>
          )}
          {(data.attributes ?? []).map((item) => (
            <div key={item.id} className="flex min-w-0 gap-2 text-[10px]">
              <span className="w-14 shrink-0 truncate text-muted-foreground">{item.label}</span>
              <span className="min-w-0 flex-1 truncate text-right font-mono">{item.value || 'Not set'}</span>
            </div>
          ))}
        </div>
      )}
    </BaseNode>
  )
}
