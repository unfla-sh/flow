import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  type XYPosition,
} from '@xyflow/react'
import { useCallback, useMemo } from 'react'

import { useInternalNode, useReactFlow } from '@xyflow/react'
import { useWorkflowStore } from '@/store/workflowStore'
import type { EdgeCardinality, EdgeKind, WorkflowEdge } from '@/types/workflow'

const EDGE_STROKES: Record<EdgeKind, string> = {
  flow: '#64748b',
  reporting: '#64748b',
  relationship: '#475569',
  network: '#0284c7',
  data: '#7c3aed',
  dependency: '#d97706',
}

const CARDINALITY_LABELS: Record<EdgeCardinality, string> = {
  one: '1',
  'zero-one': '0..1',
  many: '1..N',
  'zero-many': '0..N',
}

function smoothPath(points: XYPosition[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const mid = { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 }
    path += ` Q ${current.x} ${current.y} ${mid.x} ${mid.y}`
  }
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`
  return path
}

function midpoint(points: XYPosition[]): XYPosition {
  if (points.length === 0) return { x: 0, y: 0 }
  const middle = Math.floor(points.length / 2)
  return points[middle]
}

function splitMidpoint(points: XYPosition[]): XYPosition {
  if (points.length < 2) return midpoint(points)
  const middle = Math.floor(points.length / 2)
  if (points.length % 2 === 1) return points[middle]
  return {
    x: (points[middle - 1].x + points[middle].x) / 2,
    y: (points[middle - 1].y + points[middle].y) / 2,
  }
}

/**
 * A self-loop (source === target) drawn as a rounded loop that arches clear of
 * the node instead of crossing back under it. Anchored to the node's real
 * bounding box so it never overlaps the body, whatever the node's size.
 */
function selfLoopPath(
  node: { x: number; y: number; width: number; height: number } | null,
  // Fallback handle coords used before the node has been measured.
  sourceX: number,
  sourceY: number,
): [string, number, number] {
  const nodeX = node ? node.x : sourceX - 100
  const nodeY = node ? node.y : sourceY - 40
  const width = node?.width ?? 200
  const height = node?.height ?? 80
  // Loop height scales a little with the node so tall nodes still get a visible arch.
  const loop = 56 + Math.min(height, 200) * 0.25
  const startX = nodeX + width * 0.62
  const endX = nodeX + width * 0.38
  const top = nodeY
  // Control points fan out past the anchors to pinch the curve into a loop.
  const path = [
    `M ${startX} ${top}`,
    `C ${nodeX + width * 0.92} ${top - loop}`,
    `${nodeX + width * 0.08} ${top - loop}`,
    `${endX} ${top}`,
  ].join(' ')
  return [path, nodeX + width / 2, top - loop * 0.72]
}

function clamp(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function WorkflowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  selected,
  animated,
}: EdgeProps<WorkflowEdge>) {
  const updateEdge = useWorkflowStore((state) => state.updateEdge)
  const presentationMode = useWorkflowStore((state) => state.presentationMode)
  const { screenToFlowPosition } = useReactFlow()
  const isSelfLoop = source === target
  // Only subscribe to the node when we actually need its box (self-loops).
  const selfNode = useInternalNode(isSelfLoop ? source : '')
  const selfBox = useMemo(() => {
    if (!isSelfLoop || !selfNode) return null
    return {
      x: selfNode.internals.positionAbsolute.x,
      y: selfNode.internals.positionAbsolute.y,
      width: selfNode.measured.width ?? 200,
      height: selfNode.measured.height ?? 80,
    }
  }, [isSelfLoop, selfNode])
  const edgeKind = data?.kind ?? 'flow'
  const stroke = data?.style?.stroke ?? EDGE_STROKES[edgeKind]
  const lineWidth = clamp(data?.style?.lineWidth, 1.75, 1, 8)
  const arrowSize = clamp(data?.style?.arrowSize, 10, 6, 28)
  const route = data?.route
  const bendPoints = useMemo(
    () => (route?.kind === 'manual' ? (route.points ?? []) : []),
    [route],
  )
  const manualPoints = [
    { x: sourceX, y: sourceY },
    ...bendPoints,
    { x: targetX, y: targetY },
  ]
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '')
  const markerEndId = `workflow-arrow-end-${safeId}`
  const markerStartId = `workflow-arrow-start-${safeId}`
  const bidirectional = data?.style?.bidirectional === true
  const showEndArrow = !bidirectional && data?.style?.arrow === true
  const showStartArrow = !bidirectional && data?.style?.arrowStart === true
  const strokeDasharray =
    data?.style?.lineStyle === 'dotted'
      ? '2 5'
      : data?.style?.lineStyle === 'dashed'
        ? '7 5'
        : undefined
  const renderedLabel = [label, data?.protocol].filter(Boolean).join(' · ')
  const staticEdgeStyle = {
    stroke,
    strokeWidth: selected ? lineWidth + 0.75 : lineWidth,
    ...(strokeDasharray ? { strokeDasharray } : {}),
  }
  const sourceCardinality = data?.sourceCardinality ?? 'one'
  const targetCardinality = data?.targetCardinality ?? 'many'
  const sourceCardinalityPosition = {
    x: sourceX + (targetX - sourceX) * 0.12,
    y: sourceY + (targetY - sourceY) * 0.12,
  }
  const targetCardinalityPosition = {
    x: sourceX + (targetX - sourceX) * 0.88,
    y: sourceY + (targetY - sourceY) * 0.88,
  }

  const routeArgs = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }
  const [autoPath, labelX, labelY] = isSelfLoop
    ? selfLoopPath(selfBox, sourceX, sourceY)
    : data?.style?.pathType === 'step'
      ? getSmoothStepPath(routeArgs)
      : getBezierPath(routeArgs)
  const manualPath = smoothPath(manualPoints)
  const path = route?.kind === 'manual' && manualPath ? manualPath : autoPath
  const manualLabel = midpoint(manualPoints)
  const bidirectionalMidpoint = splitMidpoint(manualPoints)
  const bidirectionalSourcePath = smoothPath([bidirectionalMidpoint, { x: sourceX, y: sourceY }])
  const bidirectionalTargetPath = smoothPath([bidirectionalMidpoint, { x: targetX, y: targetY }])

  const movePoint = useCallback(
    (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const targetEl = event.currentTarget
      targetEl.setPointerCapture(event.pointerId)

      const onMove = (moveEvent: PointerEvent) => {
        const position = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY })
        const points = [...bendPoints]
        points[index] = position
        updateEdge(id, { data: { route: { kind: 'manual', points } } })
      }

      const onUp = () => {
        targetEl.removeEventListener('pointermove', onMove)
        targetEl.removeEventListener('pointerup', onUp)
        targetEl.removeEventListener('pointercancel', onUp)
      }

      targetEl.addEventListener('pointermove', onMove)
      targetEl.addEventListener('pointerup', onUp)
      targetEl.addEventListener('pointercancel', onUp)
    },
    [bendPoints, id, screenToFlowPosition, updateEdge],
  )

  return (
    <>
      {(bidirectional || showEndArrow || showStartArrow) && (
        <defs>
          {(showEndArrow || bidirectional) && (
            <marker
              id={markerEndId}
              markerWidth={arrowSize}
              markerHeight={arrowSize}
              refX={arrowSize * 0.82}
              refY={arrowSize / 2}
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d={`M 0 0 L ${arrowSize} ${arrowSize / 2} L 0 ${arrowSize} z`}
                fill={stroke}
              />
            </marker>
          )}
          {(showStartArrow || bidirectional) && (
            <marker
              id={markerStartId}
              markerWidth={arrowSize}
              markerHeight={arrowSize}
              refX={arrowSize * 0.18}
              refY={arrowSize / 2}
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              {/* Apex at x=0 so, oriented along the path, it points back at the source. */}
              <path
                d={`M ${arrowSize} 0 L 0 ${arrowSize / 2} L ${arrowSize} ${arrowSize} z`}
                fill={stroke}
              />
            </marker>
          )}
        </defs>
      )}
      {bidirectional ? (
        <>
          <BaseEdge
            id={`${id}-source`}
            path={bidirectionalSourcePath}
            markerEnd={`url(#${markerStartId})`}
            className={animated ? 'workflow-edge-animated' : undefined}
            style={staticEdgeStyle}
          />
          <BaseEdge
            id={`${id}-target`}
            path={bidirectionalTargetPath}
            label={renderedLabel}
            labelX={bidirectionalMidpoint.x}
            labelY={bidirectionalMidpoint.y}
            markerEnd={`url(#${markerEndId})`}
            className={animated ? 'workflow-edge-animated' : undefined}
            style={staticEdgeStyle}
          />
        </>
      ) : (
        <BaseEdge
          id={id}
          path={path}
          label={renderedLabel}
          labelX={route?.kind === 'manual' ? manualLabel.x : labelX}
          labelY={route?.kind === 'manual' ? manualLabel.y : labelY}
          markerStart={showStartArrow ? `url(#${markerStartId})` : undefined}
          markerEnd={showEndArrow ? `url(#${markerEndId})` : undefined}
          className={animated ? 'workflow-edge-animated' : undefined}
          style={staticEdgeStyle}
        />
      )}
      {edgeKind === 'relationship' && (
        <EdgeLabelRenderer>
          {[
            { key: 'source', value: sourceCardinality, position: sourceCardinalityPosition },
            { key: 'target', value: targetCardinality, position: targetCardinalityPosition },
          ].map((item) => (
            <span
              key={`${id}-${item.key}-cardinality`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded border bg-background px-1 py-0.5 font-mono text-[8px] font-semibold text-foreground shadow-sm"
              style={{ left: item.position.x, top: item.position.y }}
            >
              {CARDINALITY_LABELS[item.value]}
            </span>
          ))}
        </EdgeLabelRenderer>
      )}
      {selected && !presentationMode && bendPoints.length > 0 && (
        <EdgeLabelRenderer>
          {bendPoints.map((point, index) => (
            <button
              key={`${id}-bend-${index}`}
              type="button"
              aria-label={`Move bend point ${index + 1}`}
              title={`Bend point ${index + 1}`}
              className="workflow-bend-point nodrag nopan absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-background text-[9px] font-bold text-primary shadow-lg ring-2 ring-background"
              style={{ left: point.x, top: point.y, pointerEvents: 'all' }}
              onPointerDown={(event) => movePoint(index, event)}
            >
              {index + 1}
            </button>
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  )
}
