import { describe, expect, it } from 'vitest'

import {
  insertBend,
  nearestSegmentIndex,
  orthogonalPoints,
  roundedPolylinePath,
  segmentMidpoints,
  snapPoint,
} from './edgeRoute'

describe('roundedPolylinePath', () => {
  it('draws a straight line for two points', () => {
    expect(roundedPolylinePath([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toBe('M 0 0 L 100 0')
  })

  it('passes through every bend point, rounding the corner', () => {
    const path = roundedPolylinePath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 10)
    // Enters the corner 10px early, uses the bend point as the curve's apex, leaves 10px after.
    expect(path).toBe('M 0 0 L 90 0 Q 100 0 100 10 L 100 100')
  })

  it('clamps the radius on short segments and survives duplicate points', () => {
    const path = roundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }],
      12,
    )
    expect(path).toBe('M 0 0 L 2 0 Q 4 0 4 2 L 4 4')
    expect(path).not.toContain('NaN')
  })
})

describe('orthogonalPoints', () => {
  it('inserts an elbow between diagonal neighbours, horizontal-first for wide gaps', () => {
    expect(orthogonalPoints([{ x: 0, y: 0 }, { x: 100, y: 40 }])).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 40 },
    ])
  })

  it('goes vertical-first for tall gaps and leaves aligned pairs alone', () => {
    expect(orthogonalPoints([{ x: 0, y: 0 }, { x: 20, y: 100 }, { x: 20, y: 200 }])).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 20, y: 100 },
      { x: 20, y: 200 },
    ])
  })
})

describe('snapPoint', () => {
  it('snaps x and y independently to nearby anchors', () => {
    const snapped = snapPoint({ x: 103, y: 50 }, [{ x: 100, y: 0 }, { x: 300, y: 56 }], 8)
    expect(snapped).toEqual({ x: 100, y: 56 })
  })

  it('leaves the point alone outside the threshold', () => {
    expect(snapPoint({ x: 120, y: 50 }, [{ x: 100, y: 0 }], 8)).toEqual({ x: 120, y: 50 })
  })
})

describe('bend insertion', () => {
  const polyline = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]

  it('finds the segment nearest a click', () => {
    expect(nearestSegmentIndex(polyline, { x: 50, y: 5 })).toBe(0)
    expect(nearestSegmentIndex(polyline, { x: 95, y: 60 })).toBe(1)
  })

  it('keeps bends ordered along the route when inserting by segment', () => {
    const bends = [{ x: 100, y: 0 }]
    expect(insertBend(bends, 0, { x: 50, y: 0 })).toEqual([{ x: 50, y: 0 }, { x: 100, y: 0 }])
    expect(insertBend(bends, 1, { x: 100, y: 50 })).toEqual([{ x: 100, y: 0 }, { x: 100, y: 50 }])
  })

  it('yields one midpoint per segment', () => {
    expect(segmentMidpoints(polyline)).toEqual([{ x: 50, y: 0 }, { x: 100, y: 50 }])
  })
})
