import { create, useStore } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'
import { newId } from '@/lib/id'
import { clamp } from '@/lib/utils'
import {
  fillCells,
  findCell,
  makeCell,
  removeCell,
  setRatioByPath,
  splitCell,
  swapCells,
  updateCell,
} from '@/layout/tree'
import { createDocument, DEFAULT_STYLE } from './document'
import {
  DEFAULT_FILTERS,
  type AssetId,
  type Background,
  type CellId,
  type CellTransform,
  type CollageDoc,
  type CollageStyle,
  type FilterState,
  type ImageAsset,
  type ImageLayer,
  type Layer,
  type LayerId,
  type LayoutMode,
  type SplitDir,
  type TextLayer,
} from '@/types'

/**
 * Single Zustand store. The `doc` field is the document (the only thing tracked
 * by zundo for undo/redo and persisted to IndexedDB). Ephemeral UI/selection/
 * tool state lives alongside it but is excluded from history via zundo's
 * `partialize`, so selecting something or panning never creates an undo step.
 */

export type Selection =
  | { kind: 'none' }
  | { kind: 'cell'; id: CellId }
  | { kind: 'layer'; id: LayerId }

export type RightTab = 'templates' | 'photos' | 'text' | 'filters' | 'inspect'

export interface EditorState {
  // ── persisted/undoable ────────────────────────────────────────────────
  doc: CollageDoc

  // ── ephemeral (excluded from history) ───────────────────────────────────
  selection: Selection
  rightTab: RightTab
  editingTextId: LayerId | null
  hydrated: boolean

  // ── document actions ────────────────────────────────────────────────────
  loadDoc: (doc: CollageDoc) => void
  newDoc: () => void
  setName: (name: string) => void
  setCanvasSize: (width: number, height: number) => void

  setLayoutMode: (mode: LayoutMode) => void
  applyTemplate: (tree: CollageDoc['layout']['tree']) => void
  setRatio: (path: ('a' | 'b')[], ratio: number) => void
  splitCellAt: (id: CellId, dir: SplitDir, assetId?: AssetId) => void
  removeCellAt: (id: CellId) => void
  swap: (a: CellId, b: CellId) => void
  assignImageToCell: (id: CellId, assetId: AssetId) => void
  clearCell: (id: CellId) => void
  updateCellTransform: (id: CellId, patch: Partial<CellTransform>) => void

  setStyle: (patch: Partial<CollageStyle>) => void
  setCellFilters: (patch: Partial<FilterState>) => void
  setBackground: (bg: Background) => void

  addAsset: (asset: ImageAsset) => void
  removeAsset: (assetId: AssetId) => void
  autoFillFromAssets: (assetIds: AssetId[]) => void
  setJustifiedOrder: (assetIds: AssetId[]) => void

  // free layers
  addLayer: (layer: Layer) => void
  addImageLayer: (assetId: AssetId) => void
  addText: (partial?: Partial<TextLayer>) => void
  updateLayer: (id: LayerId, patch: Partial<Layer>) => void
  removeLayer: (id: LayerId) => void
  duplicateLayer: (id: LayerId) => void
  reorderLayer: (id: LayerId, dir: 'front' | 'back' | 'forward' | 'backward') => void

  // ── ephemeral actions ─────────────────────────────────────────────────────
  select: (sel: Selection) => void
  setRightTab: (tab: RightTab) => void
  startEditingText: (id: LayerId) => void
  stopEditingText: () => void
  setHydrated: (v: boolean) => void
}

const CANVAS_LIMIT = 8000

export const useEditor = create<EditorState>()(
  temporal(
    immer((set) => ({
      doc: createDocument(),
      selection: { kind: 'none' },
      rightTab: 'templates',
      editingTextId: null,
      hydrated: false,

      loadDoc: (doc) =>
        set((s) => {
          s.doc = doc
          s.selection = { kind: 'none' }
        }),

      newDoc: () =>
        set((s) => {
          s.doc = createDocument()
          s.selection = { kind: 'none' }
        }),

      setName: (name) => set((s) => void (s.doc.name = name)),

      setCanvasSize: (width, height) =>
        set((s) => {
          s.doc.canvas.width = clamp(Math.round(width), 64, CANVAS_LIMIT)
          s.doc.canvas.height = clamp(Math.round(height), 64, CANVAS_LIMIT)
        }),

      setLayoutMode: (mode) =>
        set((s) => {
          s.doc.layout.mode = mode
          s.selection = { kind: 'none' }
        }),

      applyTemplate: (tree) =>
        set((s) => {
          // Preserve existing images by re-filling the new tree in order.
          const existing: AssetId[] = []
          const collect = (n: CollageDoc['layout']['tree']) => {
            if (n.kind === 'cell') {
              if (n.assetId) existing.push(n.assetId)
            } else {
              collect(n.a)
              collect(n.b)
            }
          }
          collect(s.doc.layout.tree)
          s.doc.layout.tree = fillCells(tree, existing)
          s.doc.layout.mode = 'grid'
          s.selection = { kind: 'none' }
        }),

      setRatio: (path, ratio) =>
        set((s) => {
          s.doc.layout.tree = setRatioByPath(s.doc.layout.tree, path, ratio)
        }),

      splitCellAt: (id, dir, assetId) =>
        set((s) => {
          s.doc.layout.tree = splitCell(s.doc.layout.tree, id, dir, assetId)
        }),

      removeCellAt: (id) =>
        set((s) => {
          s.doc.layout.tree = removeCell(s.doc.layout.tree, id)
          if (s.selection.kind === 'cell' && s.selection.id === id) s.selection = { kind: 'none' }
        }),

      swap: (a, b) =>
        set((s) => {
          // A locked photo stays put — don't let drag-to-swap move it.
          const ca = findCell(s.doc.layout.tree, a)
          const cb = findCell(s.doc.layout.tree, b)
          if (ca?.transform.locked || cb?.transform.locked) return
          s.doc.layout.tree = swapCells(s.doc.layout.tree, a, b)
        }),

      assignImageToCell: (id, assetId) =>
        set((s) => {
          s.doc.layout.tree = updateCell(s.doc.layout.tree, id, (cell) => ({
            ...cell,
            assetId,
            // reset transform so the new image fits cleanly
            transform: makeCell().transform,
          }))
        }),

      clearCell: (id) =>
        set((s) => {
          s.doc.layout.tree = updateCell(s.doc.layout.tree, id, (cell) => ({
            ...cell,
            assetId: undefined,
          }))
        }),

      updateCellTransform: (id, patch) =>
        set((s) => {
          s.doc.layout.tree = updateCell(s.doc.layout.tree, id, (cell) => ({
            ...cell,
            transform: { ...cell.transform, ...patch },
          }))
        }),

      setStyle: (patch) => set((s) => void Object.assign(s.doc.style, patch)),

      setCellFilters: (patch) =>
        set((s) => {
          if (s.selection.kind === 'cell') {
            const cellId = s.selection.id
            const apply = (n: CollageDoc['layout']['tree']): CollageDoc['layout']['tree'] => {
              if (n.kind === 'cell') {
                if (n.id === cellId) {
                  const existing = n.filters ?? { ...DEFAULT_FILTERS }
                  return { ...n, filters: { ...existing, ...patch } }
                }
                return n
              }
              return { ...n, a: apply(n.a), b: apply(n.b) }
            }
            s.doc.layout.tree = apply(s.doc.layout.tree)
          } else {
            Object.assign(s.doc.style.cellFilters, patch)
          }
        }),

      setBackground: (bg) => set((s) => void (s.doc.background = bg)),

      addAsset: (asset) => set((s) => void (s.doc.assets[asset.id] = asset)),

      removeAsset: (assetId) =>
        set((s) => {
          delete s.doc.assets[assetId]
          // Clear any grid cell that referenced it.
          const clearRefs = (n: CollageDoc['layout']['tree']): CollageDoc['layout']['tree'] => {
            if (n.kind === 'cell') return n.assetId === assetId ? { ...n, assetId: undefined } : n
            return { ...n, a: clearRefs(n.a), b: clearRefs(n.b) }
          }
          s.doc.layout.tree = clearRefs(s.doc.layout.tree)
          // Drop free image layers using it.
          s.doc.freeLayers = s.doc.freeLayers.filter((l) => !(l.type === 'image' && l.assetId === assetId))
          s.doc.layout.justifiedAssetIds = s.doc.layout.justifiedAssetIds.filter((id) => id !== assetId)
          if (s.doc.background.type === 'image' && s.doc.background.assetId === assetId) {
            s.doc.background = { type: 'solid', color: '#ffffff' }
          }
        }),

      autoFillFromAssets: (assetIds) =>
        set((s) => {
          // Fill empty cells in order; also remember the justified order.
          s.doc.layout.tree = fillCells(s.doc.layout.tree, dedupeUnplaced(s.doc, assetIds))
          const set2 = new Set(s.doc.layout.justifiedAssetIds)
          assetIds.forEach((a) => set2.add(a))
          s.doc.layout.justifiedAssetIds = [...set2]
        }),

      setJustifiedOrder: (assetIds) =>
        set((s) => void (s.doc.layout.justifiedAssetIds = assetIds)),

      addLayer: (layer) =>
        set((s) => {
          s.doc.freeLayers.push(layer)
          s.selection = { kind: 'layer', id: layer.id }
        }),

      addImageLayer: (assetId) =>
        set((s) => {
          const asset = s.doc.assets[assetId]
          if (!asset) return
          const maxW = s.doc.canvas.width * 0.5
          const scale = Math.min(1, maxW / Math.max(1, asset.width))
          const w = Math.max(40, asset.width * scale)
          const h = Math.max(40, asset.height * scale)
          const layer: ImageLayer = {
            id: newId('layer'),
            type: 'image',
            assetId,
            x: s.doc.canvas.width / 2 - w / 2,
            y: s.doc.canvas.height / 2 - h / 2,
            width: w,
            height: h,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            cornerRadius: 0,
            filters: { ...DEFAULT_FILTERS },
          }
          s.doc.freeLayers.push(layer)
          s.selection = { kind: 'layer', id: layer.id }
        }),

      addText: (partial) =>
        set((s) => {
          const layer: TextLayer = {
            id: newId('layer'),
            type: 'text',
            x: s.doc.canvas.width / 2 - 200,
            y: s.doc.canvas.height / 2 - 40,
            width: 400,
            height: 80,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            text: 'Double-click to edit',
            fontFamily: 'Inter',
            fontSize: 64,
            fontStyle: 'bold',
            fill: '#111827',
            align: 'center',
            lineHeight: 1.2,
            letterSpacing: 0,
            ...partial,
          }
          s.doc.freeLayers.push(layer)
          s.selection = { kind: 'layer', id: layer.id }
        }),

      updateLayer: (id, patch) =>
        set((s) => {
          const idx = s.doc.freeLayers.findIndex((l) => l.id === id)
          if (idx >= 0) Object.assign(s.doc.freeLayers[idx], patch)
        }),

      removeLayer: (id) =>
        set((s) => {
          s.doc.freeLayers = s.doc.freeLayers.filter((l) => l.id !== id)
          if (s.selection.kind === 'layer' && s.selection.id === id) s.selection = { kind: 'none' }
        }),

      duplicateLayer: (id) =>
        set((s) => {
          const orig = s.doc.freeLayers.find((l) => l.id === id)
          if (!orig) return
          const copy = { ...orig, id: newId('layer'), x: orig.x + 24, y: orig.y + 24 } as Layer
          s.doc.freeLayers.push(copy)
          s.selection = { kind: 'layer', id: copy.id }
        }),

      reorderLayer: (id, dir) =>
        set((s) => {
          const arr = s.doc.freeLayers
          const i = arr.findIndex((l) => l.id === id)
          if (i < 0) return
          const [item] = arr.splice(i, 1)
          if (dir === 'front') arr.push(item)
          else if (dir === 'back') arr.unshift(item)
          else if (dir === 'forward') arr.splice(Math.min(arr.length, i + 1), 0, item)
          else arr.splice(Math.max(0, i - 1), 0, item)
        }),

      select: (next) =>
        set((s) => {
          // Auto-remove empty text layers when deselected.
          const prevSel = s.selection
          if (prevSel.kind === 'layer') {
            const prev = s.doc.freeLayers.find((l) => l.id === prevSel.id)
            if (prev?.type === 'text' && !prev.text?.trim()) {
              s.doc.freeLayers = s.doc.freeLayers.filter((l) => l.id !== prevSel.id)
            }
          }
          s.selection = next
        }),
      setRightTab: (rightTab) => set((s) => void (s.rightTab = rightTab)),
      startEditingText: (id) => set((s) => void (s.editingTextId = id)),
      stopEditingText: () => set((s) => void (s.editingTextId = null)),
      setHydrated: (v) => set((s) => void (s.hydrated = v)),
    })),
    {
      // Only the document participates in undo/redo. Limit history depth.
      partialize: (state) => ({ doc: state.doc }) as Pick<EditorState, 'doc'>,
      limit: 100,
      // Coalesce rapid edits (e.g. dragging a slider/splitter) into one step.
      handleSet: (handleSet) => {
        let t: ReturnType<typeof setTimeout> | undefined
        return (...args: Parameters<typeof handleSet>) => {
          if (t) clearTimeout(t)
          t = setTimeout(() => handleSet(...args), 120)
        }
      },
    },
  ),
)

/** Assets not yet placed in any cell, preserving the requested order. */
function dedupeUnplaced(doc: CollageDoc, assetIds: AssetId[]): AssetId[] {
  const placed = new Set<AssetId>()
  const walk = (n: CollageDoc['layout']['tree']) => {
    if (n.kind === 'cell') {
      if (n.assetId) placed.add(n.assetId)
    } else {
      walk(n.a)
      walk(n.b)
    }
  }
  walk(doc.layout.tree)
  return assetIds.filter((a) => !placed.has(a))
}

// Convenience selectors / derived helpers used across the UI.
export const selectedCell = (s: EditorState): CellId | null =>
  s.selection.kind === 'cell' ? s.selection.id : null

export const selectedLayer = (s: EditorState): Layer | null => {
  if (s.selection.kind !== 'layer') return null
  const id = s.selection.id
  return s.doc.freeLayers.find((l) => l.id === id) ?? null
}

export const findDocCell = (s: EditorState, id: CellId) => findCell(s.doc.layout.tree, id)

export { DEFAULT_FILTERS, DEFAULT_STYLE }

/**
 * Reactive hook over zundo's temporal store (undo/redo/history). `useEditor.temporal`
 * is a vanilla StoreApi; `useStore` makes selectors reactive in React.
 */
type TemporalApi = typeof useEditor.temporal
export function useTemporal<T>(selector: (state: TemporalState) => T): T {
  return useStore(useEditor.temporal, selector)
}
useTemporal.getState = (): TemporalState => useEditor.temporal.getState()
useTemporal.api = useEditor.temporal as TemporalApi

type TemporalState = ReturnType<typeof useEditor.temporal.getState>
