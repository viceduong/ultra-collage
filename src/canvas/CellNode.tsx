import { useEffect, useMemo, useRef } from 'react'
import Konva from 'konva'
import { Circle, Group, Image as KImage, Path, Rect as KRect, Text } from 'react-konva'
import type { CellLayout } from '@/layout/geometry'
import { findCell } from '@/layout/tree'
import { useEditor } from '@/state/store'
import { useImageElement } from '@/features/images/useImageElement'
import { hasActiveFilters, konvaFilterAttrs, konvaFilters } from '@/features/filters/filters'
import { fitCellImage } from './cellImage'
import { clamp } from '@/lib/utils'
import type { CellId, CollageStyle, FilterState } from '@/types'
import { DEFAULT_FILTERS } from '@/types'

interface CellNodeProps {
  layout: CellLayout
  style: CollageStyle
  selected: boolean
  interactive: boolean
  onSelect: (id: CellId) => void
  /** All cell rects, used to hit-test drag-to-swap across the grid. */
  cells: CellLayout[]
  onSwap: (a: CellId, b: CellId) => void
}

/** Identity (cover-fit) transform — used to auto-fit on double-click. */
const FIT_TRANSFORM = { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0, flipH: false, flipV: false }

/**
 * One grid cell: a clipped Group containing the cover-fit image (pannable by
 * dragging) or an empty placeholder. Filters from the document style are
 * applied via Konva caching.
 */
export function CellNode({ layout, style, selected, interactive, onSelect, cells, onSwap }: CellNodeProps) {
  const { rect, id } = layout
  const cell = useEditor((s) => findCell(s.doc.layout.tree, id))
  const asset = useEditor((s) => (cell?.assetId ? s.doc.assets[cell.assetId] : undefined))
  const updateCellTransform = useEditor((s) => s.updateCellTransform)

  // Manual double-click detection. Konva's own `dblclick` is unreliable on a
  // node while it is `draggable` (the drag machinery swallows the second click),
  // which is exactly the case for a selected cell. Tracking the time between
  // pointerdowns ourselves works regardless of selection/drag state.
  const lastDownRef = useRef(0)
  // Set right after a double-click reset. The second mousedown of a double-click
  // can start a Konva drag whose trailing `dragMove` would otherwise re-commit a
  // stale pan (most visibly on the vertical axis), undoing part of the reset.
  // While this guard is active we stop any such drag and ignore its pan commit.
  const justResetRef = useRef(false)

  const handleDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!interactive) return
    // Only (re)select if not already selected — re-dispatching the same
    // selection creates a new state object, forcing a re-render that would
    // cancel a drag (e.g. the rotate handle) starting on this same mousedown.
    if (!selected) onSelect(id)
    const now = Date.now()
    if (asset && !cell?.transform.locked && now - lastDownRef.current < 300) {
      updateCellTransform(id, FIT_TRANSFORM) // auto-fit: re-center & cover
      lastDownRef.current = 0
      justResetRef.current = true
      // Cancel any drag the second mousedown may have initiated, and snap the
      // image node back to the centered (reset) position immediately so a
      // trailing dragMove reads center, not the old panned offset.
      const node = imgRef.current
      if (node) {
        node.stopDrag()
        node.position({ x: rect.width / 2, y: rect.height / 2 })
        node.getLayer()?.batchDraw()
      }
      e.cancelBubble = true
      // Release the guard after the click sequence settles.
      window.setTimeout(() => (justResetRef.current = false), 250)
    } else {
      lastDownRef.current = now
    }
  }

  /** Which cell contains a point (in collage coords), if any. */
  const cellAtPoint = (px: number, py: number): CellId | null => {
    for (const c of cells) {
      if (px >= c.rect.x && px <= c.rect.x + c.rect.width && py >= c.rect.y && py <= c.rect.y + c.rect.height) {
        return c.id
      }
    }
    return null
  }

  const image = useImageElement(asset?.url)
  const imgRef = useRef<Konva.Image>(null)

  // Filters apply only to the selected cell; when nothing is selected they apply globally.
  const cellSelection = useEditor((s) => s.selection)
  const applyFilters = cellSelection.kind !== 'cell' || cellSelection.id === cell?.id
  // Use per-cell filters if set, otherwise global.
  const globalFilters = style.cellFilters
  const effectiveFilters = cell?.filters ?? globalFilters
  const filters = applyFilters ? effectiveFilters : { ...DEFAULT_FILTERS }
  const placement = useMemo(() => {
    if (!cell || !asset) return null
    return fitCellImage(rect, { width: asset.width, height: asset.height }, cell.transform)
  }, [cell, asset, rect])

  // (Re)cache when filters or the image change so Konva filters render.
  useEffect(() => {
    if (!image) return
    const node = imgRef.current
    if (!node) return
    if (hasActiveFilters(filters)) {
      node.cache()
      node.filters(konvaFilters(filters))
      const attrs = konvaFilterAttrs(filters)
      Object.entries(attrs).forEach(([k, v]) => node.setAttr(k, v))
      node.setAttr('hue', filters.hue)
      node.setAttr('luminance', 0)
    } else {
      node.clearCache()
      node.filters([])
    }
    node.getLayer()?.batchDraw()
  }, [image, filters, placement])

  if (!cell) return null

  const locked = cell.transform.locked ?? false

  const clipFn = (ctx: Konva.Context) => {
    roundedRectPath(ctx, 0, 0, rect.width, rect.height, clamp(style.cornerRadius, 0, Math.min(rect.width, rect.height) / 2))
  }

  return (
    <>
    <Group
      x={rect.x}
      y={rect.y}
      clipFunc={clipFn}
      onMouseDown={handleDown}
      onTap={handleDown}
    >
      {/* Cell backing — visible when empty or while images load. */}
      <KRect width={rect.width} height={rect.height} fill={asset ? '#1c1f27' : '#eef1f6'} />

      {image && placement && asset && (
        <KImage
          ref={imgRef}
          image={image}
          x={placement.x}
          y={placement.y}
          width={placement.width}
          height={placement.height}
          offsetX={placement.offsetX}
          offsetY={placement.offsetY}
          rotation={placement.rotation}
          scaleX={placement.scaleX}
          scaleY={placement.scaleY}
          draggable={interactive && selected && !locked}
          onDragMove={(e) => {
            // Ignore the stray drag that a double-click reset may have started —
            // committing its pan would re-introduce the gap we just cleared.
            if (justResetRef.current) {
              e.target.position({ x: rect.width / 2, y: rect.height / 2 })
              return
            }
            // Convert the dragged center back into pan fractions, using the
            // image's *rotation-aware* bounding box so a tilted photo can never
            // be panned far enough to expose an empty corner of the cell.
            const node = e.target
            const drawnW = asset.width * Math.abs(placement.scaleX)
            const drawnH = asset.height * Math.abs(placement.scaleY)
            const rad = (placement.rotation * Math.PI) / 180
            const bboxW = Math.abs(drawnW * Math.cos(rad)) + Math.abs(drawnH * Math.sin(rad))
            const bboxH = Math.abs(drawnW * Math.sin(rad)) + Math.abs(drawnH * Math.cos(rad))
            const maxPanX = Math.max(0, (bboxW - rect.width) / 2)
            const maxPanY = Math.max(0, (bboxH - rect.height) / 2)
            const panX = node.x() - rect.width / 2
            const panY = node.y() - rect.height / 2
            updateCellTransform(id, {
              offsetX: maxPanX ? clamp(panX / maxPanX, -1, 1) : 0,
              offsetY: maxPanY ? clamp(panY / maxPanY, -1, 1) : 0,
            })
          }}
          onDragEnd={(e) => {
            if (justResetRef.current) return
            // If the drag finished over a *different* cell, swap the two images
            // instead of panning. The layer's relative pointer is in collage
            // coordinates — the same space as the cell rects.
            const point = e.target.getLayer()?.getRelativePointerPosition()
            const target = point ? cellAtPoint(point.x, point.y) : null
            if (target && target !== id) {
              // Discard the in-cell pan that accrued during the drag, then swap.
              updateCellTransform(id, { offsetX: 0, offsetY: 0 })
              onSwap(id, target)
            }
          }}
        />
      )}

      {!asset && (
        <Text
          text="＋"
          fontSize={Math.min(48, rect.height / 3)}
          fill="#9aa4b2"
          width={rect.width}
          height={rect.height}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}

      {/* Selection outline. */}
      {selected && interactive && (
        <KRect
          width={rect.width}
          height={rect.height}
          cornerRadius={style.cornerRadius}
          stroke="#6366f1"
          strokeWidth={3}
          listening={false}
        />
      )}

    </Group>

    {/* Overlays rendered OUTSIDE the clipped cell group so they sit on top and
        remain fully hit-testable (a clipped group can hide/);occlude children). */}
    {selected && interactive && asset && !locked && (
      <RotateHandle
        cx={rect.x + rect.width / 2}
        cy={rect.y + rect.height / 2}
        startRotation={cell.transform.rotation}
        onRotate={(rotation) => updateCellTransform(id, { rotation })}
      />
    )}

    {selected && interactive && asset && locked && (
      <Group x={rect.x + 10} y={rect.y + 10} listening={false}>
        <Circle x={9} y={9} radius={13} fill="#6366f1" />
        <Path data="M5 8 V6 a4 4 0 0 1 8 0 V8 M3.5 8 h11 v7 h-11 z" stroke="#fff" strokeWidth={1.6} y={1} />
      </Group>
    )}
    </>
  )
}

/**
 * A draggable circular-arrow control at the cell center. Rotation is derived
 * from the pointer's angle around the center, so the photo tracks the cursor.
 */
function RotateHandle({
  cx,
  cy,
  startRotation,
  onRotate,
}: {
  cx: number // cell center in layer (collage) coordinates
  cy: number
  startRotation: number
  onRotate: (rotation: number) => void
}) {
  const startAngleRef = useRef(0)
  const baseRotationRef = useRef(startRotation)
  // The handle's absolute (stage) position, captured at drag start so the
  // dragBoundFunc can pin it in place while we read only the pointer angle.
  const pinRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const pointerAngle = (e: Konva.KonvaEventObject<DragEvent | MouseEvent>): number | null => {
    const p = e.target.getLayer()?.getRelativePointerPosition()
    if (!p) return null
    // Angle of the pointer around the cell center (both in layer coords).
    return (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI
  }

  const beginRotate = (e: Konva.KonvaEventObject<DragEvent | MouseEvent>) => {
    const a = pointerAngle(e)
    if (a != null) {
      startAngleRef.current = a
      baseRotationRef.current = startRotation
    }
    const abs = e.target.getAbsolutePosition()
    pinRef.current = { x: abs.x, y: abs.y }
  }

  return (
    <Group
      x={cx}
      y={cy}
      draggable
      // Pin the handle in place (we only consume the pointer angle to rotate).
      dragBoundFunc={() => pinRef.current}
      onMouseDown={beginRotate}
      onDragStart={beginRotate}
      onDragMove={(e) => {
        const a = pointerAngle(e)
        if (a == null) return
        let next = baseRotationRef.current + (a - startAngleRef.current)
        // Normalize to (-180, 180].
        next = ((((next + 180) % 360) + 360) % 360) - 180
        onRotate(Math.round(next))
      }}
      onMouseEnter={(e) => {
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = 'default'
      }}
    >
      <Circle radius={16} fill="#6366f1" shadowColor="black" shadowBlur={6} shadowOpacity={0.4} />
      {/* circular arrow glyph */}
      <Path
        data="M -6 0 A 6 6 0 1 1 0 6"
        stroke="#fff"
        strokeWidth={2}
        lineCap="round"
        listening={false}
      />
      <Path data="M 0 6 l -3 -3 M 0 6 l 3 -3" stroke="#fff" strokeWidth={2} lineCap="round" listening={false} />
    </Group>
  )
}

/** Identity for the filter type so other modules can share it. */
export type CellFilterState = FilterState

function roundedRectPath(ctx: Konva.Context, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
