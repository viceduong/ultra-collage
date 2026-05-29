import justifiedLayout from 'justified-layout'
import type { ImageAsset, Rect } from '@/types'

/**
 * Thin wrapper around Flickr's `justified-layout` — the production-grade
 * algorithm used by Flickr's photo stream. We feed it aspect ratios and a
 * target container width, and it returns geometry for a row-justified gallery
 * (no cropping; every image keeps its aspect ratio; last row is balanced).
 */

export interface JustifiedBox extends Rect {
  assetId: string
}

export interface JustifiedResult {
  boxes: JustifiedBox[]
  containerHeight: number
}

export function computeJustified(
  assets: ImageAsset[],
  containerWidth: number,
  opts: { targetRowHeight?: number; spacing: number; padding: number },
): JustifiedResult {
  if (assets.length === 0) return { boxes: [], containerHeight: 0 }

  const ratios = assets.map((a) => (a.height > 0 ? a.width / a.height : 1))
  const geom = justifiedLayout(ratios, {
    containerWidth,
    containerPadding: opts.padding,
    boxSpacing: opts.spacing,
    targetRowHeight: opts.targetRowHeight ?? Math.max(120, containerWidth / 4),
    targetRowHeightTolerance: 0.25,
    showWidows: true,
  })

  const boxes: JustifiedBox[] = geom.boxes.map((b, i) => ({
    assetId: assets[i].id,
    x: b.left,
    y: b.top,
    width: b.width,
    height: b.height,
  }))

  return { boxes, containerHeight: geom.containerHeight }
}
