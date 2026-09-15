/**
 * Geometry for manually routed edges.
 *
 * A manual route is the ordered list of bend points the user placed between
 * the edge's two endpoints. The line passes *through* every bend point (unlike
 * a bezier control point), so the handle the user drags is exactly where the
 * line goes. Corners are rounded a little so the route still reads as a
 * connector rather than a wire diagram.
 */

export interface Point {
  x: number
  y: number
}

/** Default corner radius for manual routes, in flow units. */
export const CORNER_RADIUS = 12

/** Distance (in flow units) within which a dragged bend point snaps into alignment. */
export const SNAP_THRESHOLD = 8

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01
}

/** Drop consecutive duplicates so a degenerate segment never produces NaN math. */
function dedupe(points: Point[]): Point[] {
  const out: Point[] = []
  for (const point of points) {
    if (out.length === 0 || !samePoint(out[out.length - 1], point)) out.push(point)
  }
  return out
}

/**
 * An SVG path through every point in order, with each interior corner rounded
 * by `radius` (clamped to half the shorter adjacent segment so short segments
 * never invert).
 */
export function roundedPolylinePath(input: Point[], radius = CORNER_RADIUS): string {
  const points = dedupe(input)
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = points[index - 1]
    const corner = points[index]
    const next = points[index + 1]
    const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y)
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    if (r <= 0.5) {
      path += ` L ${corner.x} ${corner.y}`
      continue
    }
    const entry = {
      x: corner.x - ((corner.x - prev.x) / inLen) * r,
      y: corner.y - ((corner.y - prev.y) / inLen) * r,
    }
    const exit = {
      x: corner.x + ((next.x - corner.x) / outLen) * r,
      y: corner.y + ((next.y - corner.y) / outLen) * r,
    }
    path += ` L ${entry.x} ${entry.y} Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`
  }
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`
  return path
}

/**
 * Expand a point list into a right-angle route: any pair of consecutive
 * points that is not already horizontally or vertically aligned gets an elbow
 * inserted. The first leg leaves horizontally when the horizontal distance is
 * the larger one, otherwise vertically, so long runs stay straight.
 */
export function orthogonalPoints(input: Point[]): Point[] {
  const points = dedupe(input)
  if (points.length < 2) return points
  const out: Point[] = [points[0]]
  for (let index = 1; index < points.length; index += 1) {
    const from = out[out.length - 1]
    const to = points[index]
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (Math.abs(dx) > 0.5 && Math.abs(dy) > 0.5) {
      out.push(Math.abs(dx) >= Math.abs(dy) ? { x: to.x, y: from.y } : { x: from.x, y: to.y })
    }
    out.push(to)
  }
  return out
}

/** Midpoint of each consecutive segment; index i belongs to segment (i, i+1). */
export function segmentMidpoints(points: Point[]): Point[] {
  const out: Point[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    out.push({
      x: (points[index].x + points[index + 1].x) / 2,
      y: (points[index].y + points[index + 1].y) / 2,
    })
  }
  return out
}

/**
 * Pull `point` onto any anchor's x or y line when it is within `threshold`.
 * Anchors are the neighbouring bend points and the edge endpoints, so a
 * dragged point clicks into a straight horizontal or vertical segment.
 */
export function snapPoint(point: Point, anchors: Point[], threshold = SNAP_THRESHOLD): Point {
  const best = { ...point }
  let bestDx = threshold
  let bestDy = threshold
  for (const anchor of anchors) {
    const dx = Math.abs(anchor.x - point.x)
    if (dx < bestDx) {
      bestDx = dx
      best.x = anchor.x
    }
    const dy = Math.abs(anchor.y - point.y)
    if (dy < bestDy) {
      bestDy = dy
      best.y = anchor.y
    }
  }
  return best
}

/** Nearest point on segment ab to p. */
function projectOntoSegment(p: Point, a: Point, b: Point): Point {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  if (len2 === 0) return { ...a }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2))
  return { x: a.x + abx * t, y: a.y + aby * t }
}

/**
 * Index of the segment of the polyline (endpoints included) closest to `p`.
 * Used to decide where a click on the line should insert a new bend point.
 */
export function nearestSegmentIndex(points: Point[], p: Point): number {
  let best = 0
  let bestDist = Infinity
  for (let index = 0; index < points.length - 1; index += 1) {
    const q = projectOntoSegment(p, points[index], points[index + 1])
    const dist = Math.hypot(q.x - p.x, q.y - p.y)
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
  }
  return best
}

/**
 * Insert a bend point into the bend list. `segmentIndex` counts segments of
 * the full polyline (source, ...bends, target), so segment i sits between bend
 * i-1 and bend i; inserting at i keeps the list ordered along the route.
 */
export function insertBend(bends: Point[], segmentIndex: number, point: Point): Point[] {
  const index = Math.max(0, Math.min(bends.length, segmentIndex))
  return [...bends.slice(0, index), point, ...bends.slice(index)]
}
