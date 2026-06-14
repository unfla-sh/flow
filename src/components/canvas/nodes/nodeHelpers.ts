import { Position } from '@xyflow/react'
import type { CSSProperties } from 'react'

import { useWorkflowStore } from '@/store/workflowStore'
import type { FlowDirection, NodeStyle } from '@/types/workflow'

export function useActiveFlowDirection(): FlowDirection {
  return useWorkflowStore((state) => {
    const flowId = state.activeFlowPath[state.activeFlowPath.length - 1]
    return state.doc.flows[flowId]?.settings?.direction ?? 'lr'
  })
}

export function useNodeInteractionState() {
  const direction = useActiveFlowDirection()
  const presentationMode = useWorkflowStore((state) => state.presentationMode)

  return { direction, presentationMode }
}

export function targetPosition(direction: FlowDirection): Position {
  return direction === 'tb' ? Position.Top : Position.Left
}

export function sourcePosition(direction: FlowDirection): Position {
  return direction === 'tb' ? Position.Bottom : Position.Right
}

export function nodeStyle(style: NodeStyle | undefined): CSSProperties {
  return {
    ...(style?.borderColor ? { borderColor: style.borderColor } : {}),
    ...(style?.fillColor ? { backgroundColor: style.fillColor } : {}),
    ...(style?.borderStyle ? { borderStyle: style.borderStyle } : {}),
    ...(style?.textColor ? { color: style.textColor } : {}),
  }
}

/** Pick a readable foreground (#rgb / #rrggbb) for a given background colour. */
function readableOn(hex: string): string {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return 'inherit'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#1f2937' : '#ffffff'
}

/** Inline override for a node's icon chip when a custom background is set. */
export function iconChipStyle(iconBg: string | undefined): CSSProperties | undefined {
  if (!iconBg) return undefined
  return { backgroundColor: iconBg, color: readableOn(iconBg) }
}

/**
 * Shared NodeResizer styling for resizable nodes (frame, note, decision):
 * larger, high-contrast handles and a clearer border so the resize area is
 * easy to spot and grab. Spread onto <NodeResizer {...resizerProps} … />.
 */
export const resizerProps = {
  color: '#2563eb',
  handleStyle: { width: 11, height: 11, borderRadius: 3 } as CSSProperties,
  lineStyle: { borderWidth: 2 } as CSSProperties,
}
