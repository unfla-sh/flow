import { Handle, type NodeProps } from '@xyflow/react'
import { CircleCheck, CirclePlay } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { WorkflowNode } from '@/types/workflow'

import { MidHandles } from './MidHandles'
import { nodeStyle, sourcePosition, targetPosition, useNodeInteractionState } from './nodeHelpers'

export function StartNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { direction, presentationMode } = useNodeInteractionState()

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <NodeIcon name={data.icon} fallback={CirclePlay} className="size-3.5" />
      {data.label}
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

export function EndNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { direction, presentationMode } = useNodeInteractionState()

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <NodeIcon name={data.icon} fallback={CircleCheck} className="size-3.5" />
      {data.label}
      <Handle
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <MidHandles connectable={!presentationMode} />
    </div>
  )
}
