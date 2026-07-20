import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import Konva from 'konva'
import { Group, Image as KImage, Layer as KLayer, Rect as KRect, Stage } from 'react-konva'
import { computeJustified } from '@/layout/justified'
import { computeLayout, innerFrame } from '@/layout/geometry'
import { useEditor } from '@/state/store'
import { useImageIngest } from '@/features/images/useImages'
import { useImageElement } from '@/features/images/useImageElement'
import { CellNode } from './CellNode'
import { SplitHandle } from './SplitHandle'
import { FreeLayer } from './FreeLayer'
import { BackgroundLayer } from './BackgroundLayer'
import { findCell as findCellInTree } from '@/layout/tree'
import { clamp } from '@/lib/utils'
import type { CellId, ImageAsset } from '@/types'

/**
 * The interactive editor canvas. Always centered, no pan/zoom/scroll.
 * Canvas fits the viewport with padding; resizes responsively.
 */
export function CollageStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  const doc = useEditor((s) => s.doc)
  const select = useEditor((s) => s.select)
  const selection = useEditor((s) => s.selection)
  const assignImageToCell = useEditor((s) => s.assignImageToCell)
  const updateCellTransform = useEditor((s) => s.updateCellTransform)
  const ingest = useImageIngest()

  const { width: cw, height: ch } = doc.canvas

  // Track container size.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Clicking empty stage clears selection.
  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) select({ kind: 'none' })
  }

  // Scroll-to-zoom when a cell with an image is selected.
  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    if (selection.kind !== 'cell') return
    const selId = selection.id
    const cell = findCellInTree(doc.layout.tree, selId)
    if (!cell?.assetId || cell.transform.locked) return
    // Check the pointer is actually over this cell.
    const stage = stageRef.current
    if (!stage) return
    const layerPos = stage.getRelativePointerPosition()
    if (!layerPos) return
    const under = cellAtCollagePoint(layerPos.x, layerPos.y)
    if (under !== selId) return
    const dir = e.evt.deltaY > 0 ? -1 : 1
    const nextZoom = clamp(cell.transform.zoom * (1 + dir * 0.08), 1, 6)
    updateCellTransform(selId, { zoom: nextZoom })
  }

  // ── Drag-drop of photos from tray onto a cell ───────────────────────────
  const [dropCell, setDropCell] = useState<CellId | null>(null)
  const layout = useMemo(
    () => computeLayout(doc.layout.tree, innerFrame(doc.canvas, doc.style), doc.style),
    [doc.layout.tree, doc.canvas, doc.style],
  )

  const cellAtCollagePoint = (x: number, y: number): CellId | null => {
    for (const c of layout.cells) {
      if (x >= c.rect.x && x <= c.rect.x + c.rect.width && y >= c.rect.y && y <= c.rect.y + c.rect.height) {
        return c.id
      }
    }
    return null
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (doc.layout.mode === 'grid') setDropCell(cellAtPointer(e.clientX, e.clientY))
  }
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const target = cellAtPointer(e.clientX, e.clientY)
    setDropCell(null)
    const assetId = e.dataTransfer.getData('text/asset-id')
    if (assetId && target) {
      assignImageToCell(target, assetId)
      return
    }
    if (e.dataTransfer.files.length) {
      const ids = await ingest(e.dataTransfer.files)
      if (ids[0] && target) assignImageToCell(target, ids[0])
    }
  }

  // Derive centering from size (null-safe: won't be used when size is null).
  const pad = 48
  const derived = useMemo(() => {
    if (!size) return { zoom: 1, offsetX: 0, offsetY: 0 }
    const z = Math.min((size.width - pad) / cw, (size.height - pad) / ch, 2)
    return {
      zoom: z,
      offsetX: (size.width - cw * z) / 2,
      offsetY: (size.height - ch * z) / 2,
    }
  }, [size, cw, ch])

  const interactive = true

  const cellAtPointer = useCallback(
    (clientX: number, clientY: number): CellId | null => {
      const stage = stageRef.current
      if (!stage) return null
      const box = stage.container().getBoundingClientRect()
      const x = (clientX - box.left - derived.offsetX) / derived.zoom
      const y = (clientY - box.top - derived.offsetY) / derived.zoom
      return cellAtCollagePoint(x, y)
    },
    [layout, derived],
  )

  if (!size) {
    return (
      <div ref={containerRef} className="relative h-full w-full bg-[#0c0d12]" />
    )
  }

  const { zoom, offsetX, offsetY } = derived

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0c0d12]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={() => setDropCell(null)}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={offsetX}
        y={offsetY}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={onStageMouseDown}
        onWheel={onWheel}
      >
        {/* Background + drop shadow frame */}
        <KLayer listening={false}>
          <KRect x={0} y={0} width={cw} height={ch} fill="#fff" shadowColor="black" shadowBlur={40} shadowOpacity={0.4} shadowOffsetY={12} />
          <Group clipX={0} clipY={0} clipWidth={cw} clipHeight={ch}>
            <BackgroundLayer background={doc.background} width={cw} height={ch} />
          </Group>
        </KLayer>

        {/* Content */}
        <KLayer>
          <Group clipX={0} clipY={0} clipWidth={cw} clipHeight={ch}>
            {doc.layout.mode === 'grid' && (
              <GridContent layout={layout} dropCell={dropCell} interactive={interactive} />
            )}
            {doc.layout.mode === 'justified' && <JustifiedContent />}
          </Group>

          {/* Free layers render above the grid in all modes. */}
          {doc.freeLayers.map((layer) => (
            <FreeLayer
              key={layer.id}
              layer={layer}
              selected={selection.kind === 'layer' && selection.id === layer.id}
              interactive={interactive}
              onSelect={(id) => select({ kind: 'layer', id })}
            />
          ))}
        </KLayer>
      </Stage>
    </div>
  )
}

function GridContent({
  layout,
  dropCell,
  interactive,
}: {
  layout: ReturnType<typeof computeLayout>
  dropCell: CellId | null
  interactive: boolean
}) {
  const doc = useEditor((s) => s.doc)
  const selection = useEditor(useShallow((s) => s.selection))
  const select = useEditor((s) => s.select)
  const swap = useEditor((s) => s.swap)

  return (
    <>
      {layout.cells.map((cl) => (
        <CellNode
          key={cl.id}
          layout={cl}
          style={doc.style}
          selected={selection.kind === 'cell' && selection.id === cl.id}
          interactive={interactive}
          onSelect={(id) => select({ kind: 'cell', id })}
          cells={layout.cells}
          onSwap={swap}
        />
      ))}

      {/* Drop highlight */}
      {dropCell &&
        layout.cells
          .filter((c) => c.id === dropCell)
          .map((c) => (
            <KRect
              key="drop"
              x={c.rect.x}
              y={c.rect.y}
              width={c.rect.width}
              height={c.rect.height}
              cornerRadius={doc.style.cornerRadius}
              fill="rgba(99,102,241,0.25)"
              stroke="#6366f1"
              strokeWidth={3}
              listening={false}
            />
          ))}

      {/* Splitters on top */}
      {interactive && layout.splitters.map((s) => <SplitHandle key={s.path.join('') || 'root'} splitter={s} />)}
    </>
  )
}

/** Row-justified gallery using Flickr's algorithm. */
function JustifiedContent() {
  const doc = useEditor((s) => s.doc)
  const order = doc.layout.justifiedAssetIds.length
    ? doc.layout.justifiedAssetIds
    : Object.keys(doc.assets)
  const assets = order.map((id) => doc.assets[id]).filter(Boolean) as ImageAsset[]

  const inner = innerFrame(doc.canvas, doc.style)
  const result = computeJustified(assets, inner.width, {
    spacing: doc.style.spacing,
    padding: 0,
    targetRowHeight: Math.max(120, inner.height / 3),
  })

  return (
    <Group x={inner.x} y={inner.y}>
      {result.boxes.map((b) => (
        <JustifiedBox key={b.assetId} assetId={b.assetId} box={b} radius={doc.style.cornerRadius} />
      ))}
    </Group>
  )
}

function JustifiedBox({
  assetId,
  box,
  radius,
}: {
  assetId: string
  box: { x: number; y: number; width: number; height: number }
  radius: number
}) {
  const asset = useEditor((s) => s.doc.assets[assetId])
  const image = useImageElement(asset?.url)
  if (!image) return null
  return (
    <KImage
      image={image}
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      cornerRadius={radius}
    />
  )
}


