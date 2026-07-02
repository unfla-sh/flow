import { Handle, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { TARGET_HANDLE_ID, type WorkflowNode } from '@/types/workflow'

import {
  iconChipStyle,
  nodeStyle,
  sourcePosition,
  targetPosition,
  useNodeInteractionState,
} from './nodeHelpers'

export function ConditionNode({ data, selected }: NodeProps<WorkflowNode>) {
  const expression = data.params.expression as string | undefined
  const { direction, presentationMode } = useNodeInteractionState()
  const branchPosition = sourcePosition(direction)

  return (
    <div
      className={cn(
        'relative w-44 rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300"
          style={iconChipStyle(data.style?.iconBg)}
        >
          <NodeIcon name={data.icon} fallback={GitBranch} className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{data.label}</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">
            {expression || 'no condition set'}
          </div>
        </div>
      </div>
      <Handle
        id={TARGET_HANDLE_ID}
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <Handle
        id="true"
        type="source"
        position={branchPosition}
        style={direction === 'tb' ? { left: '35%' } : { top: '35%' }}
        className="!size-2.5 !bg-emerald-500"
        isConnectable={!presentationMode}
      />
      <Handle
        id="false"
        type="source"
        position={branchPosition}
        style={direction === 'tb' ? { left: '75%' } : { top: '75%' }}
        className="!size-2.5 !bg-rose-500"
        isConnectable={!presentationMode}
      />
      <div
        className={cn(
          'pointer-events-none absolute text-[9px] font-medium text-emerald-600 dark:text-emerald-400',
          direction === 'tb' ? 'bottom-[-18px] left-[24%]' : '-right-9 top-[22%]',
        )}
      >
        true
      </div>
      <div
        className={cn(
          'pointer-events-none absolute text-[9px] font-medium text-rose-600 dark:text-rose-400',
          direction === 'tb' ? 'bottom-[-18px] left-[66%]' : '-right-9 top-[62%]',
        )}
      >
        false
      </div>
    </div>
  )
}
