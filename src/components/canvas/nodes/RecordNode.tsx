import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KeyRound, Table2 } from 'lucide-react'

import { NodeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { RecordFieldKey, WorkflowNode } from '@/types/workflow'

import { MidHandles } from './MidHandles'
import { iconChipStyle, nodeStyle, useNodeInteractionState } from './nodeHelpers'

const KEY_LABELS: Record<Exclude<RecordFieldKey, 'none'>, string> = {
  primary: 'PK',
  foreign: 'FK',
  unique: 'UQ',
}

export function RecordNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { presentationMode } = useNodeInteractionState()
  const recordKind = String(data.params.recordKind ?? 'Table')
  const namespace = String(data.params.namespace ?? '')
  const fields = data.fields ?? []

  return (
    <div
      className={cn(
        'w-72 overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-ring',
      )}
      style={nodeStyle(data.style)}
    >
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded bg-secondary text-secondary-foreground"
          style={iconChipStyle(data.style?.iconBg)}
        >
          <NodeIcon name={data.icon} fallback={Table2} className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-xs font-semibold">{data.label}</div>
          <div className="truncate text-[9px] text-muted-foreground">
            {[namespace, recordKind].filter(Boolean).join(' / ')}
          </div>
        </div>
      </div>
      {fields.length === 0 ? (
        <div className="px-3 py-3 text-[10px] text-muted-foreground">Add fields in the Behavior tab</div>
      ) : (
        <div>
          {fields.map((field, index) => {
            const key = field.key && field.key !== 'none' ? field.key : undefined
            return (
              <div
                key={field.id}
                className={cn(
                  'relative flex h-8 items-center gap-2 px-3 font-mono text-[10px]',
                  index > 0 && 'border-t border-border/60',
                )}
              >
                <Handle
                  id={`field:${field.id}:left`}
                  type="source"
                  position={Position.Left}
                  className="!size-2 !border-background !bg-muted-foreground"
                  isConnectable={!presentationMode}
                />
                <span className="flex w-6 shrink-0 items-center justify-center text-[8px] font-bold text-amber-700 dark:text-amber-300">
                  {key ? KEY_LABELS[key] : field.nullable ? '?' : ''}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{field.name || 'unnamed'}</span>
                <span className="max-w-24 shrink-0 truncate text-muted-foreground">{field.dataType || 'unknown'}</span>
                {key === 'primary' && <KeyRound className="size-3 shrink-0 text-amber-600" />}
                <Handle
                  id={`field:${field.id}:right`}
                  type="source"
                  position={Position.Right}
                  className="!size-2 !border-background !bg-muted-foreground"
                  isConnectable={!presentationMode}
                />
              </div>
            )
          })}
        </div>
      )}
      <MidHandles connectable={!presentationMode} />
    </div>
  )
}
