import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Ellipse, Group, Image as KImage, Line, Rect as KRect, RegularPolygon, Star, Text, Transformer } from 'react-konva'
import type { ImageLayer, Layer, LayerId, ShapeLayer, StickerLayer, TextLayer } from '@/types'
import { useEditor } from '@/state/store'
import { useImageElement } from '@/features/images/useImageElement'
import { hasActiveFilters, konvaFilterAttrs, konvaFilters } from '@/features/filters/filters'

// ── Gradient utilities ──────────────────────────────────────────────────────

/** Parse 'linear-gradient(135deg, #from, #to)' → { from, to } or null. */
function parseGradient(s: string): { from: string; to: string } | null {
  const m = s.match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/)
  return m ? { from: m[1].trim(), to: m[2].trim() } : null
}

/** Compute Konva fill gradient props for a shape of given size. */
function gradientProps(w: number, h: number, s: string) {
  const g = parseGradient(s)
  if (!g) return null
  // 135deg: top-left to bottom-right diagonal
  const cx = w / 2, cy = h / 2
  const d = Math.sqrt(w * w + h * h) / 2
  return {
    fillLinearGradientStartPoint: { x: cx - d * 0.707, y: cy - d * 0.707 },
    fillLinearGradientEndPoint: { x: cx + d * 0.707, y: cy + d * 0.707 },
    fillLinearGradientColorStops: [0, g.from, 1, g.to] as [number, string, number, string],
  }
}

interface FreeLayerProps {
  layer: Layer
  selected: boolean
  interactive: boolean
  onSelect: (id: LayerId) => void
}

/** A freeform layer plus its Transformer (resize/rotate) when selected. */
export function FreeLayer({ layer, selected, interactive, onSelect }: FreeLayerProps) {
  const nodeRef = useRef<Konva.Node>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const updateLayer = useEditor((s) => s.updateLayer)

  useEffect(() => {
    if (selected && interactive && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [selected, interactive, layer])

  if (!layer.visible) return null

  const common = {
    ref: nodeRef as never,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    draggable: interactive && !layer.locked,
    onMouseDown: () => interactive && onSelect(layer.id),
    onTap: () => interactive && onSelect(layer.id),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      updateLayer(layer.id, { x: e.target.x(), y: e.target.y() }),
  }

  const onTransformEnd = () => {
    const node = nodeRef.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const patch: Record<string, number> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(8, layer.width * scaleX),
    }
    // Height auto-sizes for text — don't apply scale.
    if (layer.type !== 'text') {
      patch.height = Math.max(8, layer.height * scaleY)
    }
    updateLayer(layer.id, patch)
  }

  return (
    <>
      {layer.type === 'text' && <TextNode layer={layer} common={common} onTransformEnd={onTransformEnd} />}
      {layer.type === 'shape' && <ShapeNode layer={layer} common={common} onTransformEnd={onTransformEnd} />}
      {layer.type === 'sticker' && <StickerNode layer={layer} common={common} onTransformEnd={onTransformEnd} />}
      {layer.type === 'image' && <ImageNode layer={layer} common={common} onTransformEnd={onTransformEnd} />}

      {selected && interactive && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={false}
          anchorSize={9}
          anchorCornerRadius={2}
          anchorStroke="#6366f1"
          anchorFill="#fff"
          borderStroke="#6366f1"
          borderStrokeWidth={1.5}
          padding={2}
          boundBoxFunc={(_old, next) => (next.width < 8 || next.height < 8 ? _old : next)}
        />
      )}
    </>
  )
}

type CommonProps = Record<string, unknown>

function TextNode({ layer, common, onTransformEnd }: { layer: TextLayer; common: CommonProps; onTransformEnd: () => void }) {
  const select = useEditor((s) => s.select)
  const textRef = useRef<Konva.Text>(null)
  const [textH, setTextH] = useState(layer.height)
  const bg = layer.background
  const pad = layer.backgroundPadding ?? 12
  const cr = layer.backgroundCornerRadius ?? 8

  // Track actual rendered text height for background sizing.
  // useLayoutEffect fires before paint — no one-frame glitch on new lines.
  useLayoutEffect(() => {
    const node = textRef.current
    if (node) {
      const h = node.getHeight()
      if (h > 0 && h !== textH) setTextH(h)
    }
  })

  const bgH = Math.max(layer.height, textH)

  const isFillGradient = layer.fill.startsWith('linear')
  const fillGrad = isFillGradient ? gradientProps(layer.width, bgH, layer.fill) : null
  const isBgGradient = bg?.startsWith('linear')
  const bgGrad = isBgGradient ? gradientProps(layer.width + pad * 2, bgH + pad * 2, bg!) : null

  return (
    <Group {...common}>
      {bg && (
        <KRect
          x={-pad}
          y={-pad}
          width={layer.width + pad * 2}
          height={bgH + pad * 2}
          fill={isBgGradient ? undefined : bg}
          cornerRadius={cr}
          listening={false}
          {...(bgGrad ?? {})}
        />
      )}
      <Text
        ref={textRef}
        x={0}
        y={0}
        text={layer.text}
        width={layer.width}
        fontFamily={layer.fontFamily}
        fontSize={layer.fontSize}
        fontStyle={layer.fontStyle}
        fill={isFillGradient ? undefined : layer.fill}
        {...(fillGrad ?? {})}
        align={layer.align}
        lineHeight={layer.lineHeight}
        letterSpacing={layer.letterSpacing}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth ?? 0}
        shadowColor={layer.shadow ? 'rgba(0,0,0,0.35)' : undefined}
        shadowBlur={layer.shadow ? 8 : 0}
        shadowOffsetY={layer.shadow ? 3 : 0}
        onTransformEnd={onTransformEnd}
        onDblClick={() => select({ kind: 'layer', id: layer.id })}
      />
    </Group>
  )
}

function ShapeNode({ layer, common, onTransformEnd }: { layer: ShapeLayer; common: CommonProps; onTransformEnd: () => void }) {
  const fill = layer.fill
  const stroke = layer.stroke
  const strokeWidth = layer.strokeWidth
  const w = layer.width
  const h = layer.height
  const props = { fill, stroke, strokeWidth, onTransformEnd }

  switch (layer.shape) {
    case 'ellipse':
      return <Ellipse {...common} {...props} radiusX={w / 2} radiusY={h / 2} offsetX={-w / 2} offsetY={-h / 2} />
    case 'triangle':
      return <RegularPolygon {...common} {...props} sides={3} radius={Math.min(w, h) / 2} offsetX={-w / 2} offsetY={-h / 2} />
    case 'star':
      return (
        <Star {...common} {...props} numPoints={5} innerRadius={Math.min(w, h) / 4} outerRadius={Math.min(w, h) / 2} offsetX={-w / 2} offsetY={-h / 2} />
      )
    case 'line':
      return <Line {...common} {...props} points={[0, h / 2, w, h / 2]} lineCap="round" />
    case 'heart':
      return <Line {...common} {...props} closed bezier points={heartPoints(w, h)} />
    case 'rect':
    default:
      return <KRect {...common} {...props} width={w} height={h} cornerRadius={layer.cornerRadius} />
  }
}

function StickerNode({ layer, common, onTransformEnd }: { layer: StickerLayer; common: CommonProps; onTransformEnd: () => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const size = Math.min(layer.width, layer.height)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = layer.width
    canvas.height = layer.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, layer.width, layer.height)
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(layer.emoji ?? '★', layer.width / 2, layer.height / 2)
    const dataUrl = canvas.toDataURL()
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.src = dataUrl
  }, [layer.emoji, layer.width, layer.height, size])

  if (!image) return null

  return (
    <KImage
      {...common}
      image={image}
      width={layer.width}
      height={layer.height}
      onTransformEnd={onTransformEnd}
    />
  )
}

function ImageNode({ layer, common, onTransformEnd }: { layer: ImageLayer; common: CommonProps; onTransformEnd: () => void }) {
  const asset = useEditor((s) => s.doc.assets[layer.assetId])
  const image = useImageElement(asset?.url)
  const ref = (common as { ref: React.RefObject<Konva.Image> }).ref

  useEffect(() => {
    const node = ref?.current
    if (!node || !image) return
    if (hasActiveFilters(layer.filters)) {
      node.cache()
      node.filters(konvaFilters(layer.filters))
      Object.entries(konvaFilterAttrs(layer.filters)).forEach(([k, v]) => node.setAttr(k, v))
    } else {
      node.clearCache()
      node.filters([])
    }
    node.getLayer()?.batchDraw()
  }, [image, layer.filters, ref])

  if (!image) return null
  return (
    <KImage
      {...common}
      image={image}
      width={layer.width}
      height={layer.height}
      cornerRadius={layer.cornerRadius}
      onTransformEnd={onTransformEnd}
    />
  )
}

/** Rough heart silhouette as a closed bezier, scaled into w×h. */
function heartPoints(w: number, h: number): number[] {
  const sx = w / 100
  const sy = h / 100
  return [
    50, 90, 10, 55, 10, 30, 30, 10, 50, 30, 70, 10, 90, 30, 90, 55, 50, 90,
  ].map((v, i) => (i % 2 === 0 ? v * sx : v * sy))
}
