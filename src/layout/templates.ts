import type { LayoutNode } from '@/types'
import { gridTree, makeCell, makeSplit } from './tree'

/**
 * Curated collage templates. Each is a factory returning a fresh tree (new ids)
 * so applying a template never aliases nodes across the document/history.
 *
 * `cells` lets the UI show the count; `category` groups them in the picker.
 */
export interface Template {
  id: string
  name: string
  cells: number
  category: 'grid' | 'feature' | 'mosaic'
  build: () => LayoutNode
}

const c = makeCell
const h = (a: LayoutNode, b: LayoutNode, r = 0.5) => makeSplit('h', a, b, r)
const v = (a: LayoutNode, b: LayoutNode, r = 0.5) => makeSplit('v', a, b, r)

export const TEMPLATES: Template[] = [
  // ── Even grids ─────────────────────────────────────────────────────────
  { id: 'g-1', name: 'Single', cells: 1, category: 'grid', build: () => c() },
  { id: 'g-2h', name: '2 · Side by side', cells: 2, category: 'grid', build: () => h(c(), c()) },
  { id: 'g-2v', name: '2 · Stacked', cells: 2, category: 'grid', build: () => v(c(), c()) },
  { id: 'g-3h', name: '3 · Columns', cells: 3, category: 'grid', build: () => gridTree(1, 3) },
  { id: 'g-3v', name: '3 · Rows', cells: 3, category: 'grid', build: () => gridTree(3, 1) },
  { id: 'g-4', name: '4 · Grid', cells: 4, category: 'grid', build: () => gridTree(2, 2) },
  { id: 'g-6', name: '6 · Grid', cells: 6, category: 'grid', build: () => gridTree(2, 3) },
  { id: 'g-9', name: '9 · Grid', cells: 9, category: 'grid', build: () => gridTree(3, 3) },
  { id: 'g-2x4', name: '2×4 Grid', cells: 8, category: 'grid', build: () => gridTree(2, 4) },
  { id: 'g-3x5', name: '3×5 Grid', cells: 15, category: 'grid', build: () => gridTree(3, 5) },

  // ── Feature layouts (one hero + supporting) ─────────────────────────────
  {
    id: 'f-left',
    name: 'Hero left',
    cells: 3,
    category: 'feature',
    build: () => h(c(), v(c(), c()), 0.62),
  },
  {
    id: 'f-right',
    name: 'Hero right',
    cells: 3,
    category: 'feature',
    build: () => h(v(c(), c()), c(), 0.38),
  },
  {
    id: 'f-top',
    name: 'Hero top',
    cells: 3,
    category: 'feature',
    build: () => v(c(), h(c(), c()), 0.62),
  },
  {
    id: 'f-bottom',
    name: 'Hero bottom',
    cells: 3,
    category: 'feature',
    build: () => v(h(c(), c()), c(), 0.38),
  },
  {
    id: 'f-center',
    name: 'Big + 4',
    cells: 5,
    category: 'feature',
    build: () => h(h(c(), v(c(), c()), 0.55), v(c(), c()), 0.66),
  },
  {
    id: 'f-sidebar',
    name: 'Sidebar + 3',
    cells: 4,
    category: 'feature',
    build: () => h(c(), v(c(), v(c(), c())), 0.55),
  },

  // ── Mosaics (asymmetric, magazine-style) ────────────────────────────────
  {
    id: 'm-5',
    name: 'Mosaic 5',
    cells: 5,
    category: 'mosaic',
    build: () => v(h(c(), h(c(), c(), 0.5), 0.4), h(c(), c(), 0.6), 0.55),
  },
  {
    id: 'm-5b',
    name: 'Mosaic 5B',
    cells: 5,
    category: 'mosaic',
    build: () =>
      h(
        v(c(), c(), 0.6),
        v(c(), h(c(), c(), 0.5), 0.4),
        0.5,
      ),
  },
  {
    id: 'm-7',
    name: 'Mosaic 7',
    cells: 7,
    category: 'mosaic',
    build: () =>
      h(
        v(c(), h(c(), c()), 0.55),
        v(h(c(), c()), v(c(), c()), 0.45),
        0.5,
      ),
  },
  {
    id: 'm-pinwheel',
    name: 'Pinwheel',
    cells: 5,
    category: 'mosaic',
    build: () =>
      v(
        h(c(), c(), 0.66),
        h(v(c(), c(), 0.5), c(), 0.34),
        0.5,
      ),
  },
  {
    id: 'm-lshape',
    name: 'L-shape',
    cells: 4,
    category: 'mosaic',
    build: () =>
      v(
        h(c(), c()),
        c(),
        0.50,
      ),
  },
  {
    id: 'm-zagzig',
    name: 'Zigzag',
    cells: 4,
    category: 'mosaic',
    build: () =>
      h(
        v(c(), c(), 0.65),
        v(c(), c(), 0.35),
        0.5,
      ),
  },
  {
    id: 'm-stagger',
    name: 'Staggered 3',
    cells: 3,
    category: 'mosaic',
    build: () => h(v(c(), c(), 0.7), c(), 0.55),
  },
  {
    id: 'm-railroad',
    name: 'Railroad',
    cells: 6,
    category: 'mosaic',
    build: () =>
      v(
        v(c(), c(), 0.33),
        h(v(c(), c()), v(c(), c()), 0.5),
        0.5,
      ),
  },
  {
    id: 'm-triple',
    name: 'Triple stack',
    cells: 3,
    category: 'mosaic',
    build: () =>
      v(
        c(),
        h(c(), c()),
        0.5,
      ),
  },
]

export const TEMPLATE_CATEGORIES: { id: Template['category']; label: string }[] = [
  { id: 'grid', label: 'Grids' },
  { id: 'feature', label: 'Featured' },
  { id: 'mosaic', label: 'Mosaics' },
]
