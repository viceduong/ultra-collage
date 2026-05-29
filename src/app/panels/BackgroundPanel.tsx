import { useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { ColorField } from '@/components/ui/ColorField'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { useEditor } from '@/state/store'
import { useImageIngest } from '@/features/images/useImages'
import { GRADIENT_PRESETS, SOLID_PRESETS } from '@/data/stickers'
import { cn } from '@/lib/utils'
import type { Background } from '@/types'

export function BackgroundPanel() {
  const bg = useEditor((s) => s.doc.background)
  const setBackground = useEditor((s) => s.setBackground)
  const ingest = useImageIngest()
  const fileRef = useRef<HTMLInputElement>(null)

  const tabs: { id: Background['type']; label: string }[] = [
    { id: 'solid', label: 'Color' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'image', label: 'Image' },
    { id: 'transparent', label: 'None' },
  ]

  const switchTo = (type: Background['type']) => {
    if (type === bg.type) return
    if (type === 'solid') setBackground({ type: 'solid', color: '#ffffff' })
    else if (type === 'gradient') setBackground({ type: 'gradient', from: '#a1c4fd', to: '#c2e9fb', angle: 45 })
    else if (type === 'transparent') setBackground({ type: 'transparent' })
    else fileRef.current?.click()
  }

  return (
    <div className="panel-section space-y-3">
      <span className="panel-label">Background</span>
      <div className="flex gap-1 rounded-lg bg-elevated p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTo(t.id)}
            className={cn(
              'flex-1 rounded-md px-1 py-1 text-xs font-medium transition-colors',
              bg.type === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {bg.type === 'solid' && (
        <>
          <ColorField value={bg.color} onChange={(color) => setBackground({ type: 'solid', color })} />
          <div className="grid grid-cols-6 gap-1.5">
            {SOLID_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setBackground({ type: 'solid', color: c })}
                className="aspect-square rounded border border-black/20"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </>
      )}

      {bg.type === 'gradient' && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {GRADIENT_PRESETS.map((g, i) => (
              <button
                key={i}
                onClick={() => setBackground({ type: 'gradient', from: g.from, to: g.to, angle: bg.angle })}
                className="aspect-square rounded border border-black/20"
                style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="From" value={bg.from} onChange={(from) => setBackground({ ...bg, from })} />
            <ColorField label="To" value={bg.to} onChange={(to) => setBackground({ ...bg, to })} />
          </div>
          <Slider label="Angle" min={0} max={360} value={bg.angle} unit="°" onChange={(angle) => setBackground({ ...bg, angle })} />
        </>
      )}

      {bg.type === 'image' && (
        <>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Change image
          </Button>
          <Slider label="Blur" min={0} max={40} value={bg.blur} unit="px" onChange={(blur) => setBackground({ ...bg, blur })} />
          <Slider label="Zoom" min={1} max={3} step={0.05} value={bg.scale} unit="×" onChange={(scale) => setBackground({ ...bg, scale })} />
        </>
      )}

      {bg.type === 'transparent' && (
        <p className="text-xs text-muted-foreground">
          No background — useful for PNG export with transparency.
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files
          if (f?.length) {
            const ids = await ingest(f)
            if (ids[0]) setBackground({ type: 'image', assetId: ids[0], blur: 0, scale: 1 })
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}
