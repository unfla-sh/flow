import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { Diamond } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { WorkflowNode } from '@/types/workflow'

import { resizerProps, targetPosition, useNodeInteractionState } from './nodeHelpers'

function strokeDasharray(borderStyle: string | undefined): string | undefined {
  if (borderStyle === 'dashed') return '8 6'
  if (borderStyle === 'dotted') return '2 5'
  return undefined
}

export function DecisionNode({ data, selected }: NodeProps<WorkflowNode>) {
  const expression = data.params.expression as string | undefined
  const { direction, presentationMode } = useNodeInteractionState()
  const borderColor = data.style?.borderColor ?? 'var(--border)'
  const fillColor = data.style?.fillColor ?? 'var(--card)'

  // A diamond's connection points are its four vertices (the mid-points of the
  // bounding-box edges). Incoming enters at the "before" vertex; the two
  // branches leave on the remaining free vertices, remapped per direction so
  // nothing floats off a slanted face when flipping LR <-> TB.
  const isTb = direction === 'tb'
  const truePos = isTb ? Position.Left : Position.Top
  const falsePos = isTb ? Position.Right : Position.Bottom

  return (
    <div className="relative flex h-full min-h-36 w-full min-w-56 items-center justify-center">
      <NodeResizer
        {...resizerProps}
        isVisible={selected && !presentationMode}
        minWidth={180}
        minHeight={120}
        keepAspectRatio={false}
      />
      <svg
        className={cn(
          'absolute inset-0 overflow-visible drop-shadow-sm',
          selected && 'ring-2 ring-ring',
        )}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="50,1 99,50 50,99 1,50"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="1.5"
          strokeDasharray={strokeDasharray(data.style?.borderStyle)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="pointer-events-none relative z-10 flex max-w-[62%] flex-col items-center gap-1 text-center">
        <NodeIcon name={data.icon} fallback={Diamond} className="size-4 text-sky-700" />
        <div className="max-w-full break-words text-xs leading-tight font-semibold">
          {data.label}
        </div>
        <div className="max-w-full break-words font-mono text-[10px] leading-tight text-muted-foreground">
          {expression || 'condition'}
        </div>
      </div>
      <Handle
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <Handle
        id="true"
        type="source"
        position={truePos}
        className="!size-2.5 !bg-emerald-500"
        isConnectable={!presentationMode}
      />
      <Handle
        id="false"
        type="source"
        position={falsePos}
        className="!size-2.5 !bg-rose-500"
        isConnectable={!presentationMode}
      />
      <span
        className={cn(
          'pointer-events-none absolute text-[9px] font-medium text-emerald-600',
          isTb ? 'top-1/2 left-1 -translate-y-1/2' : 'top-1 left-1/2 -translate-x-1/2',
        )}
      >
        true
      </span>
      <span
        className={cn(
          'pointer-events-none absolute text-[9px] font-medium text-rose-600',
          isTb ? 'top-1/2 right-1 -translate-y-1/2' : 'bottom-1 left-1/2 -translate-x-1/2',
        )}
      >
        false
      </span>
    </div>
  )
}
