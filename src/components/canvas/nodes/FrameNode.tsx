import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Frame } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { WorkflowNode } from '@/types/workflow'

import { nodeStyle, resizerProps, useNodeInteractionState } from './nodeHelpers'

export function FrameNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { presentationMode } = useNodeInteractionState()

  return (
    <div
      className={cn(
        'h-full w-full rounded-xl border-2 border-dashed bg-muted/20',
        selected ? 'border-[#2563eb]/70 ring-2 ring-ring' : 'border-muted-foreground/40',
      )}
      style={nodeStyle(data.style)}
    >
      <NodeResizer
        {...resizerProps}
        isVisible={selected && !presentationMode}
        minWidth={200}
        minHeight={120}
      />
      <span className="absolute top-2 left-3 flex items-center gap-1.5 rounded bg-background/70 px-1 text-xs font-bold text-muted-foreground">
        <NodeIcon name={data.icon} fallback={Frame} className="size-3.5" />
        {data.label}
      </span>
    </div>
  )
}
