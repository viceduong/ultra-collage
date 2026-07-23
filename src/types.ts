/**
 * Core domain model for Ultra Collage.
 *
 * The document is the single source of truth. The grid layout is modeled as a
 * binary split-tree (content-preserving collage layout): every internal node is
 * a horizontal or vertical split with a draggable `ratio`, and leaves are cells
 * that hold an image. This is the same family of layout used by Google Photos
 * and content-preserved collage research, and it makes resizing an O(1) edit of
 * a single node's ratio.
 */

export type Rect = { x: number; y: number; width: number; height: number }

export type AssetId = string
export type CellId = string
export type LayerId = string

// ── Layout tree ────────────────────────────────────────────────────────────

export type SplitDir = 'h' | 'v' // 'h' = side-by-side (vertical divider), 'v' = stacked

/** Per-cell image placement inside its clipped frame (object-fit: cover + manual pan/zoom). */
export interface CellTransform {
  /** Pan offsets as a fraction of the cell size, range roughly [-1, 1]. */
  offsetX: number
  offsetY: number
  /** Zoom multiplier on top of cover-fit. >= 1. */
  zoom: number
  rotation: number // degrees
  flipH: boolean
  flipV: boolean
  /** When locked, the photo can't be panned/zoomed/rotated/swapped in the cell. */
  locked?: boolean
}

export interface CellNode {
  kind: 'cell'
  id: CellId
  assetId?: AssetId
  transform: CellTransform
  /** Per-cell filter overrides (falls back to style.cellFilters when absent). */
  filters?: FilterState
}

export interface SplitNodeT {
  kind: 'split'
  dir: SplitDir
  /** Fraction [0.05, 0.95] of space given to child `a`. */
  ratio: number
  a: LayoutNode
  b: LayoutNode
}

export type LayoutNode = CellNode | SplitNodeT

// ── Free layers (text / stickers / shapes / floating images) ─────────────────

export interface BaseLayer {
  id: LayerId
  // Position/size are stored in canvas (document) coordinates.
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  visible: boolean
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold'
  fill: string
  align: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  stroke?: string
  strokeWidth?: number
  shadow?: boolean
  /** Background color behind the text (undefined = transparent). */
  background?: string
  /** Padding around the text. */
  backgroundPadding?: number
  /** Corner radius of the background pill/rect. */
  backgroundCornerRadius?: number
}

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'heart' | 'line'

export interface ShapeLayer extends BaseLayer {
  type: 'shape'
  shape: ShapeKind
  fill: string
  stroke?: string
  strokeWidth: number
  cornerRadius: number
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker'
  /** An emoji glyph rendered as text, or an svg/data url. */
  emoji?: string
}

export interface ImageLayer extends BaseLayer {
  type: 'image'
  assetId: AssetId
  cornerRadius: number
  filters: FilterState
}

export type Layer = TextLayer | ShapeLayer | StickerLayer | ImageLayer

// ── Filters / adjustments ────────────────────────────────────────────────────

export interface FilterState {
  brightness: number // -1..1
  contrast: number // -100..100
  saturation: number // -2..10 (Konva HSL saturation)
  hue: number // 0..360
  blur: number // px
  grayscale: number // 0..1
  sepia: number // 0..1
  invert: number // 0..1
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
}

// ── Background ───────────────────────────────────────────────────────────────

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'image'; assetId: AssetId; blur: number; scale: number }
  | { type: 'transparent' }

// ── Style ────────────────────────────────────────────────────────────────────

export interface CollageStyle {
  spacing: number // gap between cells (px in doc space)
  outerPadding: number // padding around the whole grid
  cornerRadius: number // rounded cell corners
  cellFilters: FilterState // filters applied uniformly to all grid cells
}

// ── Document ──────────────────────────────────────────────────────────────────

export type LayoutMode = 'grid' | 'justified' | 'freeform'

export interface ImageAsset {
  id: AssetId
  name: string
  width: number
  height: number
  /** Object URL for the in-memory blob; not persisted (recreated on load). */
  url: string
  mime: string
  size: number
}

export interface CollageDoc {
  id: string
  name: string
  canvas: { width: number; height: number }
  layout: {
    mode: LayoutMode
    tree: LayoutNode
    /** Aspect ratios of the photos placed in justified mode (in order). */
    justifiedAssetIds: AssetId[]
  }
  style: CollageStyle
  background: Background
  freeLayers: Layer[]
  assets: Record<AssetId, ImageAsset>
  updatedAt: number
}

export const ASPECT_PRESETS: { label: string; w: number; h: number }[] = [
  { label: 'Square 1:1', w: 1080, h: 1080 },
  { label: 'Portrait 4:5', w: 1080, h: 1350 },
  { label: 'Story 9:16', w: 1080, h: 1920 },
  { label: 'Landscape 3:2', w: 1620, h: 1080 },
  { label: 'Widescreen 16:9', w: 1920, h: 1080 },
  { label: 'Pinterest 2:3', w: 1000, h: 1500 },
  { label: 'A4 Print', w: 2480, h: 3508 },
]
