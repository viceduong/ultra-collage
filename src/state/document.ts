import { newId } from '@/lib/id'
import { TEMPLATES } from '@/layout/templates'
import { DEFAULT_FILTERS, type Background, type CollageDoc, type CollageStyle } from '@/types'

export const DEFAULT_STYLE: CollageStyle = {
  spacing: 12,
  outerPadding: 12,
  cornerRadius: 8,
  cellFilters: { ...DEFAULT_FILTERS },
}

export const DEFAULT_BACKGROUND: Background = { type: 'solid', color: '#ffffff' }

export function createDocument(partial?: Partial<CollageDoc>): CollageDoc {
  const fourGrid = TEMPLATES.find((t) => t.id === 'g-4')!
  return {
    id: newId('doc'),
    name: 'Untitled Collage',
    canvas: { width: 1080, height: 1080 },
    layout: { mode: 'grid', tree: fourGrid.build(), justifiedAssetIds: [] },
    style: { ...DEFAULT_STYLE },
    background: { ...DEFAULT_BACKGROUND },
    freeLayers: [],
    assets: {},
    updatedAt: 0, // stamped on save; kept 0 here so it stays out of history diffs
    ...partial,
  }
}
