import { describe, expect, it } from 'vitest'
import {
  collectCells,
  countCells,
  fillCells,
  findCell,
  gridTree,
  makeCell,
  makeSplit,
  removeCell,
  setRatioByPath,
  splitCell,
  swapCells,
} from './tree'

describe('layout tree', () => {
  it('builds a grid with the right number of cells', () => {
    expect(countCells(gridTree(2, 2))).toBe(4)
    expect(countCells(gridTree(3, 3))).toBe(9)
    expect(countCells(gridTree(1, 5))).toBe(5)
  })

  it('splitCell adds exactly one cell', () => {
    const tree = makeCell()
    const split = splitCell(tree, tree.id, 'h')
    expect(countCells(split)).toBe(2)
    expect(split.kind).toBe('split')
  })

  it('removeCell collapses the parent to the sibling', () => {
    const a = makeCell()
    const b = makeCell()
    const tree = makeSplit('h', a, b)
    const removed = removeCell(tree, a.id)
    expect(removed.kind).toBe('cell')
    expect((removed as typeof b).id).toBe(b.id)
  })

  it('cannot remove the root cell', () => {
    const root = makeCell()
    expect(removeCell(root, root.id)).toBe(root)
  })

  it('setRatioByPath clamps and updates only the targeted node', () => {
    const tree = makeSplit('h', makeCell(), makeCell(), 0.5)
    const updated = setRatioByPath(tree, [], 0.99)
    expect(updated.kind === 'split' && updated.ratio).toBeLessThanOrEqual(0.92)
    const tooLow = setRatioByPath(tree, [], -1)
    expect(tooLow.kind === 'split' && tooLow.ratio).toBeGreaterThanOrEqual(0.08)
  })

  it('swapCells exchanges assets', () => {
    const a = makeCell('asset-a')
    const b = makeCell('asset-b')
    const tree = makeSplit('h', a, b)
    const swapped = swapCells(tree, a.id, b.id)
    expect(findCell(swapped, a.id)?.assetId).toBe('asset-b')
    expect(findCell(swapped, b.id)?.assetId).toBe('asset-a')
  })

  it('fillCells assigns assets in tree order', () => {
    const tree = gridTree(2, 2)
    const filled = fillCells(tree, ['1', '2', '3'])
    const ids = collectCells(filled).map((c) => c.assetId)
    expect(ids).toEqual(['1', '2', '3', undefined])
  })

  it('does not mutate the input tree', () => {
    const tree = makeSplit('h', makeCell(), makeCell())
    const before = JSON.stringify(tree)
    splitCell(tree, (tree.a as ReturnType<typeof makeCell>).id, 'v')
    expect(JSON.stringify(tree)).toBe(before)
  })
})
