import Konva from 'konva'
import { saveAs } from 'file-saver'
import { computeLayout, innerFrame } from '@/layout/geometry'
import { computeJustified } from '@/layout/justified'
import { fitCellImage } from '@/canvas/cellImage'
import { hasActiveFilters, konvaFilterAttrs, konvaFilters } from '@/features/filters/filters'
import type { Background, CollageDoc, FilterState, Layer } from '@/types'

/**
 * Renders the document to a standalone offscreen Konva stage at a pixel
 * multiplier, fully independent of the on-screen zoom, then exports a raster.
 * Reuses the exact same geometry/fit math as the live canvas so output matches
 * the editor pixel-for-pixel.
 */

export interface ExportOptions {
  format: 'png' | 'jpeg'
  scale: number // multiplier on the document size (1–4)
  quality: number // jpeg quality 0–1
  transparent: boolean // png with transparent background
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })



function applyFilters(node: Konva.Image, f: FilterState) {
  if (!hasActiveFilters(f)) return
  node.cache()
  node.filters(konvaFilters(f))
  Object.entries(konvaFilterAttrs(f)).forEach(([k, v]) => node.setAttr(k, v))
}

function roundedClip(group: Konva.Group, w: number, h: number, r: number) {
  group.clipFunc((ctx) => {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(rad, 0)
    ctx.arcTo(w, 0, w, h, rad)
    ctx.arcTo(w, h, 0, h, rad)
    ctx.arcTo(0, h, 0, 0, rad)
    ctx.arcTo(0, 0, w, 0, rad)
    ctx.closePath()
  })
}

async function buildBackground(layer: Konva.Layer, doc: CollageDoc, bg: Background, transparent: boolean) {
  const { width, height } = doc.canvas
  if (bg.type === 'transparent' || transparent) return
  if (bg.type === 'solid') {
    layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: bg.color }))
  } else if (bg.type === 'gradient') {
    const rad = (bg.angle * Math.PI) / 180
    const half = Math.max(width, height)
    layer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        fillLinearGradientStartPoint: { x: width / 2 - Math.cos(rad) * half, y: height / 2 - Math.sin(rad) * half },
        fillLinearGradientEndPoint: { x: width / 2 + Math.cos(rad) * half, y: height / 2 + Math.sin(rad) * half },
        fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
      }),
    )
  } else if (bg.type === 'image') {
    const asset = doc.assets[bg.assetId]
    if (asset?.url) {
      const img = await loadImage(asset.url)
      const cover = Math.max(width / asset.width, height / asset.height) * bg.scale
      const dw = asset.width * cover
      const dh = asset.height * cover
      const node = new Konva.Image({ image: img, x: (width - dw) / 2, y: (height - dh) / 2, width: dw, height: dh })
      if (bg.blur > 0) {
        node.cache()
        node.filters([Konva.Filters.Blur])
        node.blurRadius(bg.blur)
      }
      layer.add(node)
    }
  }
}

async function buildLayer(parent: Konva.Layer, layer: Layer, doc: CollageDoc) {
  if (!layer.visible) return
  const base = { x: layer.x, y: layer.y, rotation: layer.rotation, opacity: layer.opacity }

  if (layer.type === 'text') {
    parent.add(
      new Konva.Text({
        ...base,
        text: layer.text,
        width: layer.width,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize,
        fontStyle: layer.fontStyle,
        fill: layer.fill,
        align: layer.align,
        lineHeight: layer.lineHeight,
        letterSpacing: layer.letterSpacing,
        stroke: layer.stroke,
        strokeWidth: layer.strokeWidth ?? 0,
        shadowColor: layer.shadow ? 'rgba(0,0,0,0.35)' : undefined,
        shadowBlur: layer.shadow ? 8 : 0,
        shadowOffsetY: layer.shadow ? 3 : 0,
      }),
    )
  } else if (layer.type === 'sticker') {
    parent.add(
      new Konva.Text({ ...base, text: layer.emoji ?? '★', fontSize: Math.min(layer.width, layer.height), width: layer.width, align: 'center', verticalAlign: 'middle' }),
    )
  } else if (layer.type === 'shape') {
    const common = { ...base, fill: layer.fill, stroke: layer.stroke, strokeWidth: layer.strokeWidth }
    const { width: w, height: h } = layer
    if (layer.shape === 'ellipse') parent.add(new Konva.Ellipse({ ...common, radiusX: w / 2, radiusY: h / 2, offsetX: -w / 2, offsetY: -h / 2 }))
    else if (layer.shape === 'triangle') parent.add(new Konva.RegularPolygon({ ...common, sides: 3, radius: Math.min(w, h) / 2, offsetX: -w / 2, offsetY: -h / 2 }))
    else if (layer.shape === 'star') parent.add(new Konva.Star({ ...common, numPoints: 5, innerRadius: Math.min(w, h) / 4, outerRadius: Math.min(w, h) / 2, offsetX: -w / 2, offsetY: -h / 2 }))
    else if (layer.shape === 'line') parent.add(new Konva.Line({ ...common, points: [0, h / 2, w, h / 2], lineCap: 'round' }))
    else parent.add(new Konva.Rect({ ...common, width: w, height: h, cornerRadius: layer.cornerRadius }))
  } else if (layer.type === 'image') {
    const asset = doc.assets[layer.assetId]
    if (asset?.url) {
      const img = await loadImage(asset.url)
      const node = new Konva.Image({ ...base, image: img, width: layer.width, height: layer.height, cornerRadius: layer.cornerRadius })
      applyFilters(node, layer.filters)
      parent.add(node)
    }
  }
}

export async function renderToCanvas(doc: CollageDoc, scale: number, transparent: boolean): Promise<HTMLCanvasElement> {
  const { width, height } = doc.canvas
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  document.body.appendChild(container)

  const stage = new Konva.Stage({ container, width, height })
  try {
    const bgLayer = new Konva.Layer({ listening: false })
    const contentLayer = new Konva.Layer({ listening: false })
    stage.add(bgLayer)
    stage.add(contentLayer)

    await buildBackground(bgLayer, doc, doc.background, transparent)

    if (doc.layout.mode === 'grid') {
      const { cells } = computeLayout(doc.layout.tree, innerFrame(doc.canvas, doc.style), doc.style)
      for (const cl of cells) {
        const cell = findCellById(doc, cl.id)
        const group = new Konva.Group({ x: cl.rect.x, y: cl.rect.y })
        roundedClip(group, cl.rect.width, cl.rect.height, doc.style.cornerRadius)
        if (cell?.assetId) {
          const asset = doc.assets[cell.assetId]
          if (asset?.url) {
            const img = await loadImage(asset.url)
            const p = fitCellImage(cl.rect, { width: asset.width, height: asset.height }, cell.transform)
            const node = new Konva.Image({
              image: img,
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              offsetX: p.offsetX,
              offsetY: p.offsetY,
              rotation: p.rotation,
              scaleX: p.scaleX,
              scaleY: p.scaleY,
            })
            applyFilters(node, doc.style.cellFilters)
            group.add(node)
          }
        } else {
          group.add(new Konva.Rect({ width: cl.rect.width, height: cl.rect.height, fill: '#eef1f6' }))
        }
        contentLayer.add(group)
      }
    } else if (doc.layout.mode === 'justified') {
      const inner = innerFrame(doc.canvas, doc.style)
      const order = doc.layout.justifiedAssetIds.length ? doc.layout.justifiedAssetIds : Object.keys(doc.assets)
      const assets = order.map((id) => doc.assets[id]).filter(Boolean)
      const res = computeJustified(assets, inner.width, { spacing: doc.style.spacing, padding: 0, targetRowHeight: Math.max(120, inner.height / 3) })
      for (const b of res.boxes) {
        const asset = doc.assets[b.assetId]
        if (!asset?.url) continue
        const img = await loadImage(asset.url)
        contentLayer.add(new Konva.Image({ image: img, x: inner.x + b.x, y: inner.y + b.y, width: b.width, height: b.height, cornerRadius: doc.style.cornerRadius }))
      }
    }

    for (const layer of doc.freeLayers) await buildLayer(contentLayer, layer, doc)

    bgLayer.draw()
    contentLayer.draw()

    return stage.toCanvas({ pixelRatio: scale }) as HTMLCanvasElement
  } finally {
    stage.destroy()
    container.remove()
  }
}

export async function exportCollage(doc: CollageDoc, opts: ExportOptions): Promise<void> {
  const canvas = await renderToCanvas(doc, opts.scale, opts.transparent && opts.format === 'png')
  const mime = opts.format === 'png' ? 'image/png' : 'image/jpeg'
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), mime, opts.quality),
  )
  const safeName = (doc.name || 'collage').replace(/[^\w\-]+/g, '_')
  saveAs(blob, `${safeName}.${opts.format === 'jpeg' ? 'jpg' : 'png'}`)
}

import type { CellNode } from '@/types'

function findCellById(doc: CollageDoc, id: string): CellNode | undefined {
  function walk(n: CollageDoc['layout']['tree']): CellNode | undefined {
    if (n.kind === 'cell') return n.id === id ? n : undefined
    return walk(n.a) ?? walk(n.b)
  }
  return walk(doc.layout.tree)
}
