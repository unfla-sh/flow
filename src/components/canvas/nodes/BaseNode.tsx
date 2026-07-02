import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Handle } from '@xyflow/react'

import { cn } from '@/lib/utils'
import { TARGET_HANDLE_ID, type NodeStyle } from '@/types/workflow'

import { MidHandles } from './MidHandles'
import {
  iconChipStyle,
  nodeStyle,
  sourcePosition,
  targetPosition,
  useNodeInteractionState,
} from './nodeHelpers'

interface BaseNodeProps {
  icon: LucideIcon
  label: string
  description?: string
  selected?: boolean
  accentClassName?: string
  style?: NodeStyle
  hasTarget?: boolean
  hasSource?: boolean
  children?: ReactNode
}

export function BaseNode({
  icon: Icon,
  label,
  description,
  selected,
  accentClassName,
  style,
  hasTarget = true,
  hasSource = true,
  children,
}: BaseNodeProps) {
  const { direction, presentationMode } = useNodeInteractionState()

  return (
    <div
      className={cn(
        'w-52 rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(style)}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground',
            accentClassName,
          )}
          style={iconChipStyle(style?.iconBg)}
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{label}</div>
          {description && (
            <div className="truncate text-[10px] text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      {children}
      {hasTarget && (
        <Handle
          id={TARGET_HANDLE_ID}
          type="target"
          position={targetPosition(direction)}
          className="!size-2.5"
          isConnectable={!presentationMode}
        />
      )}
      {hasSource && (
        <Handle
          type="source"
          position={sourcePosition(direction)}
          className="!size-2.5"
          isConnectable={!presentationMode}
        />
      )}
      <MidHandles connectable={!presentationMode} />
    </div>
  )
}
