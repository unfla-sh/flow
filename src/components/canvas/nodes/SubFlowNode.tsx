import type { NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolveNodeIcon } from '@/lib/icons'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

export function SubFlowNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const openSubFlow = useWorkflowStore((state) => state.openSubFlow)
  const innerCount = useWorkflowStore((state) =>
    data.subFlowId ? (state.doc.flows[data.subFlowId]?.nodes.length ?? 0) : 0,
  )

  return (
    <BaseNode
      icon={resolveNodeIcon(data.icon, Layers)}
      label={data.label}
      description={data.description}
      selected={selected}
      style={data.style}
      accentClassName="bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(event) => {
            event.stopPropagation()
            openSubFlow(id)
          }}
        >
          Open sub-flow
        </Button>
        <Badge variant="secondary">{innerCount} nodes</Badge>
      </div>
    </BaseNode>
  )
}
