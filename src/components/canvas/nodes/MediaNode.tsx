import { type NodeProps } from '@xyflow/react'
import { Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { resolveNodeIcon } from '@/lib/icons'
import type { WorkflowNode } from '@/types/workflow'

import { BaseNode } from './BaseNode'

export function MediaNode({ data, selected }: NodeProps<WorkflowNode>) {
  const url = (data.params.url as string) ?? ''
  const kind = (data.params.kind as string) ?? 'image'
  const [imgError, setImgError] = useState(false)

  const icon = resolveNodeIcon(data.icon, ImageIcon)

  return (
    <BaseNode
      icon={icon}
      label={data.label}
      description={data.description}
      selected={selected}
      style={data.style}
    >
      <div className="px-3 py-2">
        {url === '' ? (
          <p className="text-[10px] italic text-muted-foreground">no media URL</p>
        ) : kind === 'image' ? (
          imgError ? (
            <p className="text-[10px] italic text-muted-foreground">cannot load</p>
          ) : (
            <img
              src={url}
              className="max-h-32 w-full rounded object-contain"
              draggable={false}
              onError={() => setImgError(true)}
            />
          )
        ) : kind === 'audio' ? (
          <audio controls src={url} className="w-full" />
        ) : (
          <video controls src={url} className="max-h-32 w-full rounded" />
        )}
      </div>
    </BaseNode>
  )
}
