import { Handle, type NodeProps } from '@xyflow/react'
import { Split } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { SWITCH_DEFAULT_HANDLE, TARGET_HANDLE_ID, type WorkflowNode } from '@/types/workflow'

import {
  iconChipStyle,
  nodeStyle,
  sourcePosition,
  targetPosition,
  useNodeInteractionState,
} from './nodeHelpers'

export function SwitchNode({ data, selected }: NodeProps<WorkflowNode>) {
  const expression = data.params.expression as string | undefined
  const cases = data.cases ?? []
  const { direction, presentationMode } = useNodeInteractionState()
  const branchPosition = sourcePosition(direction)

  return (
    <div
      className={cn(
        'w-52 rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300"
          style={iconChipStyle(data.style?.iconBg)}
        >
          <NodeIcon name={data.icon} fallback={Split} className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{data.label}</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">
            switch ({expression || '…'})
          </div>
        </div>
      </div>
      <div className="py-1">
        {cases.map((branch) => (
          <div key={branch.id} className="relative flex items-center px-3 py-1">
            <span className="truncate text-[10px]">
              <span className="text-muted-foreground">when </span>
              <span className="font-mono">{branch.when || '…'}</span>
            </span>
            <Handle
              id={branch.id}
              type="source"
              position={branchPosition}
              style={
                direction === 'tb'
                  ? { left: `${30 + indexOffset(cases, branch.id)}%` }
                  : undefined
              }
              className="!size-2.5 !bg-sky-500"
              isConnectable={!presentationMode}
            />
          </div>
        ))}
        <div className="relative flex items-center px-3 py-1">
          <span className="text-[10px] italic text-muted-foreground">default</span>
          <Handle
            id={SWITCH_DEFAULT_HANDLE}
            type="source"
            position={branchPosition}
            style={direction === 'tb' ? { left: '85%' } : undefined}
            className="!size-2.5 !bg-muted-foreground"
            isConnectable={!presentationMode}
          />
        </div>
      </div>
      <Handle
        id={TARGET_HANDLE_ID}
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
    </div>
  )
}

function indexOffset(cases: { id: string }[], id: string): number {
  const index = Math.max(0, cases.findIndex((branch) => branch.id === id))
  return Math.min(45, index * 15)
}
