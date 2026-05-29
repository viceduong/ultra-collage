import { newId } from '@/lib/id'
import { clamp } from '@/lib/utils'
import type { AssetId, CellId, CellNode, LayoutNode, SplitDir, SplitNodeT } from '@/types'

/**
 * Pure operations on the binary split-tree. All functions are immutable: they
 * return a new tree and never mutate the input. This keeps them trivially
 * compatible with zundo/immer history and unit-testable in isolation.
 */

export const RATIO_MIN = 0.08
export const RATIO_MAX = 0.92

export function makeCell(assetId?: AssetId): CellNode {
  return {
    kind: 'cell',
    id: newId('cell'),
    assetId,
    transform: { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0, flipH: false, flipV: false },
  }
}

export function makeSplit(dir: SplitDir, a: LayoutNode, b: LayoutNode, ratio = 0.5): SplitNodeT {
  return { kind: 'split', dir, ratio: clamp(ratio, RATIO_MIN, RATIO_MAX), a, b }
}

/** Depth-first list of all cells, left-to-right / top-to-bottom in tree order. */
export function collectCells(node: LayoutNode, out: CellNode[] = []): CellNode[] {
  if (node.kind === 'cell') {
    out.push(node)
  } else {
    collectCells(node.a, out)
    collectCells(node.b, out)
  }
  return out
}

export function countCells(node: LayoutNode): number {
  return node.kind === 'cell' ? 1 : countCells(node.a) + countCells(node.b)
}

export function findCell(node: LayoutNode, id: CellId): CellNode | undefined {
  if (node.kind === 'cell') return node.id === id ? node : undefined
  return findCell(node.a, id) ?? findCell(node.b, id)
}

/** Map over the tree, replacing the cell with `id` using `fn`. Returns a new tree. */
export function updateCell(
  node: LayoutNode,
  id: CellId,
  fn: (cell: CellNode) => CellNode,
): LayoutNode {
  if (node.kind === 'cell') return node.id === id ? fn(node) : node
  const a = updateCell(node.a, id, fn)
  const b = updateCell(node.b, id, fn)
  return a === node.a && b === node.b ? node : { ...node, a, b }
}

/** Update the ratio of a specific split node identified by structural path. */
export function setRatioByPath(node: LayoutNode, path: ('a' | 'b')[], ratio: number): LayoutNode {
  if (path.length === 0) {
    if (node.kind !== 'split') return node
    return { ...node, ratio: clamp(ratio, RATIO_MIN, RATIO_MAX) }
  }
  if (node.kind !== 'split') return node
  const [head, ...rest] = path
  if (head === 'a') return { ...node, a: setRatioByPath(node.a, rest, ratio) }
  return { ...node, b: setRatioByPath(node.b, rest, ratio) }
}

/**
 * Split the cell `id` in two, keeping the existing image in the first half and
 * placing `newAssetId` (optional) in the new half.
 */
export function splitCell(
  node: LayoutNode,
  id: CellId,
  dir: SplitDir,
  newAssetId?: AssetId,
): LayoutNode {
  if (node.kind === 'cell') {
    if (node.id !== id) return node
    return makeSplit(dir, node, makeCell(newAssetId))
  }
  return { ...node, a: splitCell(node.a, id, dir, newAssetId), b: splitCell(node.b, id, dir, newAssetId) }
}

/**
 * Remove the cell `id`: its parent split collapses, and the sibling takes the
 * parent's place. Returns the original tree if the cell is the root (cannot
 * remove the last cell) or not found.
 */
export function removeCell(node: LayoutNode, id: CellId): LayoutNode {
  if (node.kind === 'cell') return node // can't remove the root cell
  // If a direct child is the target cell, collapse to the sibling.
  if (node.a.kind === 'cell' && node.a.id === id) return node.b
  if (node.b.kind === 'cell' && node.b.id === id) return node.a
  return { ...node, a: removeCell(node.a, id), b: removeCell(node.b, id) }
}

/** Swap the images (and transforms) of two cells. Used for drag-to-rearrange. */
export function swapCells(node: LayoutNode, idA: CellId, idB: CellId): LayoutNode {
  const a = findCell(node, idA)
  const b = findCell(node, idB)
  if (!a || !b) return node
  return updateCell(updateCell(node, idA, () => ({ ...a, id: idA, assetId: b.assetId, transform: b.transform })), idB, () => ({
    ...b,
    id: idB,
    assetId: a.assetId,
    transform: a.transform,
  }))
}

/** Reset every cell's image transform (re-center & fit). */
export function resetTransforms(node: LayoutNode): LayoutNode {
  if (node.kind === 'cell') return makeCell(node.assetId) // fresh transform, same id? keep id:
  return { ...node, a: resetTransforms(node.a), b: resetTransforms(node.b) }
}

/** Build a balanced grid tree with `rows` x `cols` empty cells. */
export function gridTree(rows: number, cols: number): LayoutNode {
  const buildRow = (): LayoutNode => {
    let row: LayoutNode = makeCell()
    for (let c = 1; c < cols; c++) {
      const right = makeCell()
      row = makeSplit('h', row, right, c / (c + 1))
    }
    return rebalance(row, 'h', cols)
  }
  let grid: LayoutNode = buildRow()
  for (let r = 1; r < rows; r++) {
    grid = makeSplit('v', grid, buildRow(), r / (r + 1))
  }
  return rebalance(grid, 'v', rows)
}

/**
 * Rebuild a left-leaning chain into evenly-distributed ratios so a freshly
 * generated grid is uniform (the incremental ratios above only approximate it).
 */
function rebalance(node: LayoutNode, dir: SplitDir, count: number): LayoutNode {
  if (count <= 1 || node.kind !== 'split') return node
  // Flatten the chain of same-direction splits into its leaf order.
  const leaves: LayoutNode[] = []
  const walk = (n: LayoutNode) => {
    if (n.kind === 'split' && n.dir === dir) {
      walk(n.a)
      walk(n.b)
    } else {
      leaves.push(n)
    }
  }
  walk(node)
  return buildEven(leaves, dir)
}

/** Compose leaves into a balanced tree with equal weight per leaf. */
function buildEven(leaves: LayoutNode[], dir: SplitDir): LayoutNode {
  if (leaves.length === 1) return leaves[0]
  const mid = Math.floor(leaves.length / 2)
  const left = leaves.slice(0, mid)
  const right = leaves.slice(mid)
  return makeSplit(dir, buildEven(left, dir), buildEven(right, dir), left.length / leaves.length)
}

/** Assign asset ids to the first N empty cells in tree order. */
export function fillCells(node: LayoutNode, assetIds: AssetId[]): LayoutNode {
  let i = 0
  const apply = (n: LayoutNode): LayoutNode => {
    if (n.kind === 'cell') {
      if (i < assetIds.length) {
        const assetId = assetIds[i++]
        return { ...n, assetId }
      }
      return n
    }
    return { ...n, a: apply(n.a), b: apply(n.b) }
  }
  return apply(node)
}
