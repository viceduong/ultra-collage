import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { Group, Image as KImage, Layer as KLayer, Rect as KRect, Stage } from 'react-konva'
import { computeJustified } from '@/layout/justified'
import { computeLayout, innerFrame } from '@/layout/geometry'
import { findCell as findCellInTree } from '@/layout/tree'
import { useEditor } from '@/state/store'
import { useImageIngest } from '@/features/images/useImages'
import { useImageElement } from '@/features/images/useImageElement'
import { clamp } from '@/lib/utils'
import { CellNode } from './CellNode'
import { SplitHandle } from './SplitHandle'
import { FreeLayer } from './FreeLayer'
import { BackgroundLayer } from './BackgroundLayer'
import type { CellId, ImageAsset } from '@/types'

/**
 * The interactive editor canvas. Manages stage size (responsive to container),
 * zoom/pan, fit-to-screen, drag-drop of photos onto cells, and renders the
 * active layout mode (grid split-tree / justified / freeform).
 */
export function CollageStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  const doc = useEditor((s) => s.doc)
  const view = useEditor((s) => s.view)
  const setView = useEditor((s) => s.setView)
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

  // Fit-to-screen: compute a zoom that fits the document in the viewport.
  const fit = useCallback(() => {
    const pad = 64
    const z = Math.min((size.width - pad) / cw, (size.height - pad) / ch)
    const zoom = clamp(z, 0.05, 4)
    setView({ zoom, panX: (size.width - cw * zoom) / 2, panY: (size.height - ch * zoom) / 2 })
  }, [size, cw, ch, setView])

  // Auto-fit on canvas size change / first mount.
  const lastFitKey = useRef('')
  useEffect(() => {
    const key = `${size.width}x${size.height}:${cw}x${ch}`
    if (size.width > 0 && lastFitKey.current !== `${cw}x${ch}`) {
      fit()
      lastFitKey.current = `${cw}x${ch}`
    } else if (lastFitKey.current === '' && size.width > 0) {
      fit()
    }
    void key
  }, [size, cw, ch, fit])

  // Wheel behavior:
  //  • over the selected photo (no modifier) → zoom that photo in/out
  //  • Ctrl/⌘ + wheel → zoom the whole canvas, centered on the cursor
  //  • otherwise → pan the canvas
  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    // Photo zoom takes priority when a cell is selected and the pointer is over it.
    if (!e.evt.ctrlKey && !e.evt.metaKey && selection.kind === 'cell') {
      const layerPos = stage.getRelativePointerPosition()
      const target = layerPos ? cellAtCollagePoint(layerPos.x, layerPos.y) : null
      if (target === selection.id) {
        const cell = findCellInTree(doc.layout.tree, selection.id)
        if (cell?.assetId && !cell.transform.locked) {
          const dir = e.evt.deltaY > 0 ? -1 : 1
          const nextZoom = clamp(cell.transform.zoom * (1 + dir * 0.08), 1, 6)
          updateCellTransform(selection.id, { zoom: nextZoom })
          return
        }
      }
    }

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const old = view.zoom
      const dir = e.evt.deltaY > 0 ? -1 : 1
      const zoom = clamp(old * (1 + dir * 0.12), 0.05, 8)
      const mx = (pointer.x - view.panX) / old
      const my = (pointer.y - view.panY) / old
      setView({ zoom, panX: pointer.x - mx * zoom, panY: pointer.y - my * zoom })
    } else {
      setView({ panX: view.panX - e.evt.deltaX, panY: view.panY - e.evt.deltaY })
    }
  }

  // Clicking empty stage clears selection.
  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) select({ kind: 'none' })
  }

  // ── HTML5 drag-drop of photos from the tray onto a cell ──────────────────
  const [dropCell, setDropCell] = useState<CellId | null>(null)
  const layout = useMemo(
    () => computeLayout(doc.layout.tree, innerFrame(doc.canvas, doc.style), doc.style),
    [doc.layout.tree, doc.canvas, doc.style],
  )

  const cellAtPointer = useCallback(
    (clientX: number, clientY: number): CellId | null => {
      const stage = stageRef.current
      if (!stage) return null
      const box = stage.container().getBoundingClientRect()
      const x = (clientX - box.left - view.panX) / view.zoom
      const y = (clientY - box.top - view.panY) / view.zoom
      return cellAtCollagePoint(x, y)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, view],
  )

  /** Hit-test in collage (layer) coordinates. */
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

  const interactive = true

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
        x={view.panX}
        y={view.panY}
        scaleX={view.zoom}
        scaleY={view.zoom}
        onWheel={onWheel}
        onMouseDown={onStageMouseDown}
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

      <ViewControls onFit={fit} />
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
  const selection = useEditor((s) => s.selection)
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

function ViewControls({ onFit }: { onFit: () => void }) {
  const view = useEditor((s) => s.view)
  const setView = useEditor((s) => s.setView)
  const z = Math.round(view.zoom * 100)
  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-elevated/90 px-1.5 py-1 shadow-xl backdrop-blur">
      <button className="h-7 w-7 rounded-full text-foreground hover:bg-accent" onClick={() => setView({ zoom: clamp(view.zoom / 1.2, 0.05, 8) })}>
        −
      </button>
      <button className="min-w-14 rounded-full px-2 text-xs tabular-nums text-foreground hover:bg-accent" onClick={onFit}>
        {z}%
      </button>
      <button className="h-7 w-7 rounded-full text-foreground hover:bg-accent" onClick={() => setView({ zoom: clamp(view.zoom * 1.2, 0.05, 8) })}>
        +
      </button>
    </div>
  )
}
