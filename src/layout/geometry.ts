import type { CellId, CollageStyle, LayoutNode, Rect, SplitDir } from '@/types'

/**
 * Converts the split-tree into absolute pixel rects within a container, applying
 * outer padding and inter-cell spacing. Pure and deterministic — it drives both
 * on-screen rendering and the offscreen export stage, guaranteeing they match.
 */

export interface CellLayout {
  id: CellId
  /** The clip frame for the cell, already inset by half-spacing on each side. */
  rect: Rect
}

export interface SplitterLayout {
  /** Structural path from the root to this split node (sequence of 'a'/'b'). */
  path: ('a' | 'b')[]
  dir: SplitDir
  ratio: number
  /** The handle's hit-area rect (centered on the divider), in container space. */
  rect: Rect
  /** The bounds of the split node, used to convert a drag delta into a ratio. */
  bounds: Rect
}

export interface ComputedLayout {
  cells: CellLayout[]
  splitters: SplitterLayout[]
}

/**
 * @param root   The layout tree.
 * @param frame  The drawable area (already excluding outerPadding if desired).
 * @param style  Spacing only is used here.
 */
export function computeLayout(root: LayoutNode, frame: Rect, style: Pick<CollageStyle, 'spacing'>): ComputedLayout {
  const cells: CellLayout[] = []
  const splitters: SplitterLayout[] = []
  const halfGap = style.spacing / 2

  const walk = (node: LayoutNode, bounds: Rect, path: ('a' | 'b')[]) => {
    if (node.kind === 'cell') {
      // Inset by half the gap on every interior edge. We inset all edges by
      // halfGap and rely on the outer padding to provide the border margin,
      // which yields a uniform `spacing` gap between any two adjacent cells.
      cells.push({
        id: node.id,
        rect: {
          x: bounds.x + halfGap,
          y: bounds.y + halfGap,
          width: Math.max(0, bounds.width - style.spacing),
          height: Math.max(0, bounds.height - style.spacing),
        },
      })
      return
    }

    const { dir, ratio } = node
    let aBounds: Rect
    let bBounds: Rect
    let handleRect: Rect

    if (dir === 'h') {
      const aW = bounds.width * ratio
      aBounds = { ...bounds, width: aW }
      bBounds = { x: bounds.x + aW, y: bounds.y, width: bounds.width - aW, height: bounds.height }
      handleRect = {
        x: bounds.x + aW - halfGap - 3,
        y: bounds.y,
        width: style.spacing + 6,
        height: bounds.height,
      }
    } else {
      const aH = bounds.height * ratio
      aBounds = { ...bounds, height: aH }
      bBounds = { x: bounds.x, y: bounds.y + aH, width: bounds.width, height: bounds.height - aH }
      handleRect = {
        x: bounds.x,
        y: bounds.y + aH - halfGap - 3,
        width: bounds.width,
        height: style.spacing + 6,
      }
    }

    splitters.push({ path, dir, ratio, rect: handleRect, bounds })
    walk(node.a, aBounds, [...path, 'a'])
    walk(node.b, bBounds, [...path, 'b'])
  }

  walk(root, frame, [])
  return { cells, splitters }
}

/** The drawable area inside the canvas after applying outer padding. */
export function innerFrame(canvas: { width: number; height: number }, style: Pick<CollageStyle, 'outerPadding' | 'spacing'>): Rect {
  // Outer padding minus halfGap, because cells already inset by halfGap; this
  // makes the visible margin equal to `outerPadding`.
  const inset = style.outerPadding - style.spacing / 2
  return {
    x: inset,
    y: inset,
    width: canvas.width - inset * 2,
    height: canvas.height - inset * 2,
  }
}

/**
 * Given a pointer position in container space and a splitter, compute the new
 * ratio. Clamping to [RATIO_MIN, RATIO_MAX] is handled by setRatioByPath.
 */
export function ratioFromPointer(splitter: SplitterLayout, pointer: { x: number; y: number }): number {
  const { bounds, dir } = splitter
  if (dir === 'h') {
    return (pointer.x - bounds.x) / bounds.width
  }
  return (pointer.y - bounds.y) / bounds.height
}
