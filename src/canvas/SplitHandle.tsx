import { useState } from 'react'
import { Rect as KRect } from 'react-konva'
import type Konva from 'konva'
import type { SplitterLayout } from '@/layout/geometry'
import { ratioFromPointer } from '@/layout/geometry'
import { useEditor } from '@/state/store'

/**
 * A draggable divider between two sibling nodes. Dragging updates only the
 * `ratio` of the corresponding split node (an O(1) edit), so the whole subtree
 * re-flows live. We translate the stage pointer into the split's local space.
 */
export function SplitHandle({ splitter }: { splitter: SplitterLayout }) {
  const setRatio = useEditor((s) => s.setRatio)
  const [hover, setHover] = useState(false)
  const horizontal = splitter.dir === 'h'

  const onDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    const layer = e.target.getLayer()
    const stage = e.target.getStage()
    if (!stage || !layer) return
    // Pointer in the layer's (collage) coordinate space.
    const pos = layer.getRelativePointerPosition()
    if (!pos) return
    const ratio = ratioFromPointer(splitter, pos)
    setRatio(splitter.path, ratio)
    // Keep the handle pinned; the recomputed layout repositions it next render.
    e.target.position({ x: splitter.rect.x, y: splitter.rect.y })
  }

  return (
    <KRect
      x={splitter.rect.x}
      y={splitter.rect.y}
      width={splitter.rect.width}
      height={splitter.rect.height}
      fill={hover ? 'rgba(99,102,241,0.55)' : 'rgba(99,102,241,0)'}
      cornerRadius={3}
      draggable
      dragBoundFunc={() => ({ x: splitter.rect.x, y: splitter.rect.y })}
      onDragMove={onDrag}
      onMouseEnter={(e) => {
        setHover(true)
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = horizontal ? 'col-resize' : 'row-resize'
      }}
      onMouseLeave={(e) => {
        setHover(false)
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = 'default'
      }}
    />
  )
}
