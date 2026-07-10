import { Handle, type NodeProps } from '@xyflow/react'
import { UserRound } from 'lucide-react'
import { useState } from 'react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { TARGET_HANDLE_ID, type WorkflowNode } from '@/types/workflow'

import { MidHandles } from './MidHandles'
import {
  iconChipStyle,
  nodeStyle,
  sourcePosition,
  targetPosition,
  useNodeInteractionState,
} from './nodeHelpers'

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized.includes('vacant') || normalized.includes('open')) {
    return 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'
  }
  if (normalized.includes('leave') || normalized.includes('inactive')) {
    return 'border-border bg-muted text-muted-foreground'
  }
  return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
}

export function ProfileNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { direction, presentationMode } = useNodeInteractionState()
  const title = String(data.params.title ?? '')
  const department = String(data.params.department ?? '')
  const status = String(data.params.status ?? '')
  const avatarUrl = String(data.params.avatarUrl ?? '')
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')

  return (
    <div
      className={cn(
        'w-72 rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground"
          style={iconChipStyle(data.style?.iconBg)}
        >
          {avatarUrl && failedAvatarUrl !== avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
              draggable={false}
              onError={() => setFailedAvatarUrl(avatarUrl)}
            />
          ) : (
            <NodeIcon name={data.icon} fallback={UserRound} className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{data.label}</div>
          {title && <div className="truncate text-xs text-muted-foreground">{title}</div>}
          {department && <div className="truncate text-[10px] text-muted-foreground">{department}</div>}
        </div>
        {status && (
          <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium', statusClass(status))}>
            {status}
          </span>
        )}
      </div>
      {(data.attributes ?? []).some((item) => item.label || item.value) && (
        <div className="border-t px-3 py-2">
          {(data.attributes ?? []).map((item) => (
            <div key={item.id} className="flex min-w-0 items-baseline gap-2 py-0.5 text-[10px]">
              <span className="w-16 shrink-0 truncate text-muted-foreground">{item.label}</span>
              <span className="min-w-0 flex-1 truncate text-right">{item.value || 'Not set'}</span>
            </div>
          ))}
        </div>
      )}
      <Handle
        id={TARGET_HANDLE_ID}
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <Handle
        type="source"
        position={sourcePosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <MidHandles connectable={!presentationMode} />
    </div>
  )
}
