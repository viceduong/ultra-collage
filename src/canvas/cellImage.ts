import type { CellTransform, Rect } from '@/types'

/**
 * Computes the Konva Image placement for a photo inside a clipped cell frame,
 * implementing object-fit: cover plus the cell's manual pan/zoom/rotation. The
 * image is centered, scaled to cover, then offset by the pan fractions.
 *
 * Returns props for a Konva.Image rendered relative to the cell's top-left.
 */
export interface CellImageProps {
  x: number
  y: number
  width: number
  height: number
  offsetX: number
  offsetY: number
  rotation: number
  scaleX: number
  scaleY: number
}

export function fitCellImage(
  frame: Rect,
  natural: { width: number; height: number },
  t: CellTransform,
): CellImageProps {
  const safeW = Math.max(1, natural.width)
  const safeH = Math.max(1, natural.height)

  // Base cover scale: the larger ratio so the image fully covers the frame.
  const cover = Math.max(frame.width / safeW, frame.height / safeH)
  const scale = cover * Math.max(1, t.zoom)

  const drawnW = safeW * scale
  const drawnH = safeH * scale

  // Rotation-aware bounding box: a tilted image needs to be larger than the
  // frame on both axes to cover it, so the pan limits are computed from the
  // axis-aligned bbox of the rotated, scaled image. This keeps the clamp in
  // CellNode.onDragMove and this render in agreement (no exposed corners).
  const rad = (t.rotation * Math.PI) / 180
  const bboxW = Math.abs(drawnW * Math.cos(rad)) + Math.abs(drawnH * Math.sin(rad))
  const bboxH = Math.abs(drawnW * Math.sin(rad)) + Math.abs(drawnH * Math.cos(rad))

  // Max pan keeps the image edge from entering the frame (no empty gaps).
  const maxPanX = Math.max(0, (bboxW - frame.width) / 2)
  const maxPanY = Math.max(0, (bboxH - frame.height) / 2)
  const panX = t.offsetX * maxPanX
  const panY = t.offsetY * maxPanY

  // We render the image with its origin at the center of the frame so rotation
  // and flips pivot around the cell center.
  return {
    x: frame.width / 2 + panX,
    y: frame.height / 2 + panY,
    width: safeW,
    height: safeH,
    offsetX: safeW / 2,
    offsetY: safeH / 2,
    rotation: t.rotation,
    scaleX: scale * (t.flipH ? -1 : 1),
    scaleY: scale * (t.flipV ? -1 : 1),
  }
}
