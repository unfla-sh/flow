import type { NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'

import { resolveNodeIcon } from '@/lib/icons'
import type { WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

export function DataNode({ data, selected }: NodeProps<WorkflowNode>) {
  const url = data.params.url as string | undefined
  const prompt = data.params.prompt as string | undefined
  const expression = data.params.expression as string | undefined
  const hasOutput = data.simulatedOutput !== undefined

  return (
    <BaseNode
      icon={resolveNodeIcon(data.icon, Database)}
      label={data.label}
      description={data.description}
      selected={selected}
      style={data.style}
      accentClassName="bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300"
    >
      {(url || prompt || expression || hasOutput) && (
        <div className="space-y-1 px-3 py-2">
          {url && (
            <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              {url}
            </code>
          )}
          {prompt && (
            <p className="line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">
              {prompt}
            </p>
          )}
          {expression && (
            <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              {expression}
            </code>
          )}
          {hasOutput && (
            <div className="text-[10px] text-muted-foreground">sample output configured</div>
          )}
        </div>
      )}
    </BaseNode>
  )
}
