import type { NodeProps } from '@xyflow/react'
import { ClipboardList } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { resolveNodeIcon } from '@/lib/icons'
import { FIELD_TYPE_LABELS, type WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

const PREVIEW_FIELD_COUNT = 4

export function FormNode({ data, selected }: NodeProps<WorkflowNode>) {
  const fields = data.formSchema ?? []
  const preview = fields.slice(0, PREVIEW_FIELD_COUNT)
  const overflow = fields.length - preview.length

  return (
    <BaseNode
      icon={resolveNodeIcon(data.icon, ClipboardList)}
      label={data.label}
      description={data.description}
      selected={selected}
      style={data.style}
      accentClassName="bg-violet-100 text-violet-700"
    >
      <div className="space-y-1 px-3 py-2">
        {preview.length === 0 && (
          <div className="text-[10px] italic text-muted-foreground">No fields yet</div>
        )}
        {preview.map((field) => (
          <div key={field.id} className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px]">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </span>
            <Badge variant="secondary">{FIELD_TYPE_LABELS[field.type]}</Badge>
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-[10px] text-muted-foreground">+{overflow} more</div>
        )}
      </div>
    </BaseNode>
  )
}
