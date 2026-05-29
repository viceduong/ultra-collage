import { Image as KImage, Rect as KRect } from 'react-konva'
import type { Background } from '@/types'
import { useEditor } from '@/state/store'
import { useImageElement } from '@/features/images/useImageElement'

/** Renders the document background (solid / gradient / image / transparent). */
export function BackgroundLayer({ background, width, height }: { background: Background; width: number; height: number }) {
  if (background.type === 'transparent') {
    return null
  }

  if (background.type === 'solid') {
    return <KRect x={0} y={0} width={width} height={height} fill={background.color} listening={false} />
  }

  if (background.type === 'gradient') {
    const rad = (background.angle * Math.PI) / 180
    const cx = width / 2
    const cy = height / 2
    const half = Math.max(width, height)
    const dx = Math.cos(rad) * half
    const dy = Math.sin(rad) * half
    return (
      <KRect
        x={0}
        y={0}
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: cx - dx, y: cy - dy }}
        fillLinearGradientEndPoint={{ x: cx + dx, y: cy + dy }}
        fillLinearGradientColorStops={[0, background.from, 1, background.to]}
        listening={false}
      />
    )
  }

  return <ImageBackground assetId={background.assetId} blur={background.blur} scale={background.scale} width={width} height={height} />
}

function ImageBackground({ assetId, blur, scale, width, height }: { assetId: string; blur: number; scale: number; width: number; height: number }) {
  const asset = useEditor((s) => s.doc.assets[assetId])
  const image = useImageElement(asset?.url)
  if (!image || !asset) return <KRect width={width} height={height} fill="#111" listening={false} />

  const cover = Math.max(width / asset.width, height / asset.height) * scale
  const dw = asset.width * cover
  const dh = asset.height * cover
  return (
    <KImage
      image={image}
      x={(width - dw) / 2}
      y={(height - dh) / 2}
      width={dw}
      height={dh}
      blurRadius={blur}
      filters={blur > 0 ? undefined : undefined}
      listening={false}
    />
  )
}
