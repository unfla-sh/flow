import type { NodeProps } from '@xyflow/react'
import { FileCode2 } from 'lucide-react'

import { resolveNodeIcon } from '@/lib/icons'
import type { ScriptArg, WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

export function ScriptNode({ data, selected }: NodeProps<WorkflowNode>) {
  const args = (data.params.args as ScriptArg[] | undefined) ?? []

  return (
    <BaseNode
      icon={resolveNodeIcon(data.icon, FileCode2)}
      label={data.label}
      description={data.description}
      selected={selected}
      style={data.style}
      accentClassName="bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
    >
      <div className="px-3 py-2">
        <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          {data.scriptPath || 'script.py'}
        </code>
        {args.length > 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            {args.length} argument{args.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </BaseNode>
  )
}
