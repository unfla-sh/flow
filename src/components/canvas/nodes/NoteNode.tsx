import { NodeResizer, type NodeProps } from '@xyflow/react'

import { cn } from '@/lib/utils'
import type { WorkflowNode } from '@/types/workflow'

import { nodeStyle, resizerProps, useNodeInteractionState } from './nodeHelpers'

export function NoteNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { presentationMode } = useNodeInteractionState()

  return (
    <div
      className={cn(
        'h-full w-full rounded-md border border-amber-300 bg-amber-100 p-3 text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100',
        selected && 'ring-2 ring-amber-500',
      )}
      style={nodeStyle(data.style)}
    >
      <NodeResizer
        {...resizerProps}
        isVisible={selected && !presentationMode}
        minWidth={120}
        minHeight={60}
      />
      <p className="text-xs whitespace-pre-wrap">{data.params.text as string}</p>
    </div>
  )
}
