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
import {
  insertBend,
  nearestSegmentIndex,
  orthogonalPoints,
  roundedPolylinePath,
  segmentMidpoints,
  snapPoint,
} from '@/lib/edgeRoute'
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

/**
 * A point a fraction of the way along an SVG path. Sampled on a detached
 * path element so the label can be placed anywhere on the route, not just
 * at the renderer's midpoint. Returns null when `along` is unset or the
 * platform cannot measure paths (e.g. test DOMs).
 */
function usePathPoint(d: string, along: number | undefined): XYPosition | null {
  return useMemo(() => {
    if (along === undefined || !d) return null
    try {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      el.setAttribute('d', d)
      const point = el.getPointAtLength(el.getTotalLength() * Math.min(1, Math.max(0, along)))
      return { x: point.x, y: point.y }
    } catch {
      return null
    }
  }, [d, along])
}

const CARDINALITY_LABELS: Record<EdgeCardinality, string> = {
  one: '1',
  'zero-one': '0..1',
  many: '1..N',
  'zero-many': '0..N',
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

/**
 * Where to show the "drag to add a bend" handle for the raw segment a→b. A
 * right-angle route draws that segment as an L, so the natural grab point is
 * its elbow; a straight segment uses its midpoint.
 */
function insertHandlePosition(a: XYPosition, b: XYPosition, step: boolean): XYPosition {
  if (step) {
    const routed = orthogonalPoints([a, b])
    if (routed.length === 3) return routed[1]
  }
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
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
  const setSelectedEdge = useWorkflowStore((state) => state.setSelectedEdge)
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
  const isStep = data?.style?.pathType === 'step'
  const route = data?.route
  const isManual = route?.kind === 'manual'
  const bendPoints = useMemo(() => (isManual ? (route?.points ?? []) : []), [isManual, route])
  // The raw polyline: endpoints plus the user's bend points, in route order.
  const manualPoints = useMemo(
    () => [{ x: sourceX, y: sourceY }, ...bendPoints, { x: targetX, y: targetY }],
    [bendPoints, sourceX, sourceY, targetX, targetY],
  )
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
    // An animated edge takes its dash pattern from the `workflow-edge-animated`
    // class, which export drops with the rest of the class-based SVG styling;
    // repeat the pattern inline so the exported edge stays dashed.
    ...(strokeDasharray ? { strokeDasharray } : animated ? { strokeDasharray: '6' } : {}),
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
  const [autoPath, autoLabelX, autoLabelY] = isSelfLoop
    ? selfLoopPath(selfBox, sourceX, sourceY)
    : isStep
      ? getSmoothStepPath(routeArgs)
      : getBezierPath(routeArgs)
  // A manual route runs straight through every bend point (right-angled when
  // the edge is a step route), so the handle you drag is where the line goes.
  const routedPoints = useMemo(
    () => (isStep ? orthogonalPoints(manualPoints) : manualPoints),
    [isStep, manualPoints],
  )
  const manualPath = isManual && !isSelfLoop ? roundedPolylinePath(routedPoints) : ''
  const path = manualPath || autoPath
  const manualLabel = midpoint(segmentMidpoints(routedPoints))
  const labelX = manualPath ? manualLabel.x : autoLabelX
  const labelY = manualPath ? manualLabel.y : autoLabelY
  const bidirectionalMidpoint = splitMidpoint(manualPoints)
  const bidirectionalSourcePath = roundedPolylinePath([bidirectionalMidpoint, { x: sourceX, y: sourceY }])
  const bidirectionalTargetPath = roundedPolylinePath([bidirectionalMidpoint, { x: targetX, y: targetY }])

  // Label anchor: a chosen fraction along the path when set, else the
  // renderer's midpoint; then the drag offset.
  const labelPosition = data?.labelPosition
  const sampled = usePathPoint(bidirectional ? '' : path, labelPosition?.along)
  const labelAnchor = bidirectional ? bidirectionalMidpoint : (sampled ?? { x: labelX, y: labelY })
  const labelAt = {
    x: labelAnchor.x + (labelPosition?.dx ?? 0),
    y: labelAnchor.y + (labelPosition?.dy ?? 0),
  }

  const commitPoints = useCallback(
    (points: XYPosition[]) => {
      updateEdge(id, { data: { route: { kind: 'manual', points } } })
    },
    [id, updateEdge],
  )

  /**
   * Drag bend `index` of `points` until pointer-up. Snaps to the neighbouring
   * points' x/y lines so straight segments are easy to make; hold Alt to
   * place it freely.
   */
  const dragPoint = useCallback(
    (points: XYPosition[], index: number, event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const targetEl = event.currentTarget
      targetEl.setPointerCapture(event.pointerId)
      const working = [...points]

      const onMove = (moveEvent: PointerEvent) => {
        const raw = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY })
        const neighbours = [
          index === 0 ? { x: sourceX, y: sourceY } : working[index - 1],
          index === working.length - 1 ? { x: targetX, y: targetY } : working[index + 1],
        ]
        working[index] = moveEvent.altKey ? raw : snapPoint(raw, neighbours)
        commitPoints([...working])
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
    [commitPoints, screenToFlowPosition, sourceX, sourceY, targetX, targetY],
  )

  /** Grab a segment handle: a new bend appears under the pointer and follows it. */
  const insertAndDrag = useCallback(
    (segmentIndex: number, at: XYPosition, event: React.PointerEvent<HTMLElement>) => {
      const points = insertBend(bendPoints, segmentIndex, at)
      commitPoints(points)
      dragPoint(points, segmentIndex, event)
    },
    [bendPoints, commitPoints, dragPoint],
  )

  const removePoint = useCallback(
    (index: number) => {
      const points = bendPoints.filter((_, i) => i !== index)
      if (points.length === 0) updateEdge(id, { data: { route: { kind: 'auto' } } })
      else commitPoints(points)
    },
    [bendPoints, commitPoints, id, updateEdge],
  )

  /** Drag the label: the offset from its anchor is stored, so it follows the edge when nodes move. */
  const dragLabel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      const targetEl = event.currentTarget
      targetEl.setPointerCapture(event.pointerId)
      const start = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const initial = { dx: labelPosition?.dx ?? 0, dy: labelPosition?.dy ?? 0 }
      let moved = false

      const onMove = (moveEvent: PointerEvent) => {
        const now = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY })
        moved = true
        updateEdge(id, {
          data: {
            labelPosition: {
              ...labelPosition,
              dx: Math.round(initial.dx + now.x - start.x),
              dy: Math.round(initial.dy + now.y - start.y),
            },
          },
        })
      }
      const onUp = () => {
        targetEl.removeEventListener('pointermove', onMove)
        targetEl.removeEventListener('pointerup', onUp)
        targetEl.removeEventListener('pointercancel', onUp)
        if (!moved) setSelectedEdge(id)
      }
      targetEl.addEventListener('pointermove', onMove)
      targetEl.addEventListener('pointerup', onUp)
      targetEl.addEventListener('pointercancel', onUp)
    },
    [id, labelPosition, screenToFlowPosition, setSelectedEdge, updateEdge],
  )

  /** Double-click anywhere on the line to drop a bend point right there. */
  const onLineDoubleClick = useCallback(
    (event: React.MouseEvent<SVGGElement>) => {
      if (presentationMode || isSelfLoop) return
      event.stopPropagation()
      const at = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      commitPoints(insertBend(bendPoints, nearestSegmentIndex(manualPoints, at), at))
    },
    [bendPoints, commitPoints, isSelfLoop, manualPoints, presentationMode, screenToFlowPosition],
  )

  const showHandles = selected && !presentationMode && !isSelfLoop && !bidirectional
  const insertHandles = useMemo(() => {
    if (!showHandles) return []
    if (!isManual) return [{ x: autoLabelX, y: autoLabelY }]
    const handles: XYPosition[] = []
    for (let index = 0; index < manualPoints.length - 1; index += 1) {
      handles.push(insertHandlePosition(manualPoints[index], manualPoints[index + 1], isStep))
    }
    return handles
  }, [autoLabelX, autoLabelY, isManual, isStep, manualPoints, showHandles])

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
            markerEnd={`url(#${markerEndId})`}
            className={animated ? 'workflow-edge-animated' : undefined}
            style={staticEdgeStyle}
          />
        </>
      ) : (
        <g onDoubleClick={onLineDoubleClick}>
          <BaseEdge
            id={id}
            path={path}
            markerStart={showStartArrow ? `url(#${markerStartId})` : undefined}
            markerEnd={showEndArrow ? `url(#${markerEndId})` : undefined}
            className={animated ? 'workflow-edge-animated' : undefined}
            style={staticEdgeStyle}
          />
        </g>
      )}
      {renderedLabel && (
        <EdgeLabelRenderer>
          {/*
           * An HTML label (not BaseEdge's SVG text) so it follows the theme
           * and can be dragged. html-to-image inlines computed styles for HTML
           * nodes, so the PNG export keeps it as drawn.
           */}
          <div
            className={`workflow-edge-label nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border bg-background px-1 py-px text-[10px] leading-tight text-foreground ${selected ? 'cursor-move ring-1 ring-primary/60' : 'cursor-pointer'}`}
            style={{ left: labelAt.x, top: labelAt.y, pointerEvents: presentationMode ? 'none' : 'all' }}
            title={presentationMode ? undefined : 'Drag to move the label'}
            onPointerDown={presentationMode ? undefined : dragLabel}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            {renderedLabel}
          </div>
        </EdgeLabelRenderer>
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
      {showHandles && (
        <EdgeLabelRenderer>
          {insertHandles.map((point, index) => (
            <button
              key={`${id}-insert-${index}`}
              type="button"
              aria-label="Drag to add a bend point"
              title="Drag to add a bend point"
              className="workflow-bend-insert nodrag nopan absolute size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-primary/70 bg-background/90 shadow"
              style={{ left: point.x, top: point.y, pointerEvents: 'all' }}
              onPointerDown={(event) => insertAndDrag(index, point, event)}
              onDoubleClick={(event) => event.stopPropagation()}
            />
          ))}
          {bendPoints.map((point, index) => (
            <button
              key={`${id}-bend-${index}`}
              type="button"
              aria-label={`Move bend point ${index + 1}`}
              title="Drag to move · Alt to skip snapping · double-click to remove"
              className="workflow-bend-point nodrag nopan absolute flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border-2 border-primary bg-background text-[9px] font-bold text-primary shadow-lg ring-2 ring-background"
              style={{ left: point.x, top: point.y, pointerEvents: 'all' }}
              onPointerDown={(event) => dragPoint(bendPoints, index, event)}
              onDoubleClick={(event) => {
                event.stopPropagation()
                removePoint(index)
              }}
            >
              {index + 1}
            </button>
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  )
}
