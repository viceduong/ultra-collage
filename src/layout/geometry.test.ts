import { describe, expect, it } from 'vitest'
import { computeLayout, innerFrame, ratioFromPointer } from './geometry'
import { gridTree, makeCell, makeSplit } from './tree'
import { fitCellImage } from '@/canvas/cellImage'

describe('geometry', () => {
  it('computes one rect per cell, all inside the frame', () => {
    const frame = { x: 0, y: 0, width: 1000, height: 1000 }
    const { cells } = computeLayout(gridTree(2, 2), frame, { spacing: 0 })
    expect(cells).toHaveLength(4)
    for (const c of cells) {
      expect(c.rect.x).toBeGreaterThanOrEqual(0)
      expect(c.rect.x + c.rect.width).toBeLessThanOrEqual(1000.001)
      expect(c.rect.width).toBeGreaterThan(0)
    }
  })

  it('a horizontal split divides width by ratio', () => {
    const tree = makeSplit('h', makeCell(), makeCell(), 0.25)
    const { cells } = computeLayout(tree, { x: 0, y: 0, width: 400, height: 100 }, { spacing: 0 })
    expect(cells[0].rect.width).toBeCloseTo(100)
    expect(cells[1].rect.width).toBeCloseTo(300)
  })

  it('spacing shrinks each cell uniformly', () => {
    const tree = makeSplit('v', makeCell(), makeCell(), 0.5)
    const noGap = computeLayout(tree, { x: 0, y: 0, width: 200, height: 200 }, { spacing: 0 })
    const gap = computeLayout(tree, { x: 0, y: 0, width: 200, height: 200 }, { spacing: 20 })
    expect(gap.cells[0].rect.height).toBeLessThan(noGap.cells[0].rect.height)
  })

  it('one splitter per internal node', () => {
    const { splitters } = computeLayout(gridTree(2, 2), { x: 0, y: 0, width: 100, height: 100 }, { spacing: 0 })
    // 2x2 balanced tree has 3 internal split nodes.
    expect(splitters).toHaveLength(3)
  })

  it('innerFrame keeps the visible margin equal to outerPadding', () => {
    const f = innerFrame({ width: 1000, height: 1000 }, { outerPadding: 20, spacing: 10 })
    // inset = padding - spacing/2 = 15
    expect(f.x).toBe(15)
    expect(f.width).toBe(970)
  })

  it('ratioFromPointer maps a pointer back to a fraction', () => {
    const splitter = {
      path: [] as ('a' | 'b')[],
      dir: 'h' as const,
      ratio: 0.5,
      rect: { x: 0, y: 0, width: 1, height: 1 },
      bounds: { x: 0, y: 0, width: 200, height: 100 },
    }
    expect(ratioFromPointer(splitter, { x: 50, y: 0 })).toBeCloseTo(0.25)
  })
})

describe('fitCellImage (cover-fit)', () => {
  it('covers the frame with no gaps', () => {
    const frame = { x: 0, y: 0, width: 200, height: 100 }
    const p = fitCellImage(frame, { width: 100, height: 100 }, { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0, flipH: false, flipV: false })
    // cover scale = max(200/100, 100/100) = 2 -> drawn 200x200 covers 200x100
    expect(Math.abs(p.scaleX)).toBeCloseTo(2)
    expect(p.width * Math.abs(p.scaleX)).toBeGreaterThanOrEqual(frame.width)
    expect(p.height * Math.abs(p.scaleY)).toBeGreaterThanOrEqual(frame.height)
  })

  it('flips negate scale sign', () => {
    const p = fitCellImage({ x: 0, y: 0, width: 100, height: 100 }, { width: 100, height: 100 }, { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0, flipH: true, flipV: false })
    expect(p.scaleX).toBeLessThan(0)
    expect(p.scaleY).toBeGreaterThan(0)
  })
})
