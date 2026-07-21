import { useState } from 'react'
import { Bold, Italic, Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ColorField } from '@/components/ui/ColorField'
import { useEditor } from '@/state/store'
import { newId } from '@/lib/id'
import { STICKER_GROUPS, FONT_FAMILIES } from '@/data/stickers'
import type { StickerLayer, TextLayer } from '@/types'
import { cn } from '@/lib/utils'

/** Add text layers and emoji stickers as free layers. */
export function ElementsPanel() {
  const doc = useEditor((s) => s.doc)
  const addLayer = useEditor((s) => s.addLayer)
  const addText = useEditor((s) => s.addText)
  const selection = useEditor((s) => s.selection)
  const updateLayer = useEditor((s) => s.updateLayer)
  const [group, setGroup] = useState(0)

  const center = () => ({ x: doc.canvas.width / 2 - 80, y: doc.canvas.height / 2 - 80 })

  const selectedTextLayer = selection.kind === 'layer'
    ? doc.freeLayers.find((l) => l.id === selection.id && l.type === 'text') as TextLayer | undefined
    : undefined

  const addSticker = (emoji: string) => {
    const c = center()
    const layer: StickerLayer = {
      id: newId('layer'),
      type: 'sticker',
      emoji,
      x: c.x,
      y: c.y,
      width: 140,
      height: 140,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    }
    addLayer(layer)
  }

  const toggleStyle = (style: 'bold' | 'italic') => {
    if (!selectedTextLayer) return
    const cur = selectedTextLayer.fontStyle ?? ''
    const has = cur === style || cur.includes(style)
    if (has) {
      const next = cur.split(' ').filter((s) => s !== style).join(' ').trim()
      updateLayer(selectedTextLayer.id, { fontStyle: (next || undefined) as TextLayer['fontStyle'] })
    } else {
      const next = cur ? `${cur} ${style}` : style
      updateLayer(selectedTextLayer.id, { fontStyle: next as TextLayer['fontStyle'] })
    }
  }

  const hasStyle = (s: string) => selectedTextLayer?.fontStyle?.includes(s) ?? false

  return (
    <div>
      <div className="panel-section">
        <span className="panel-label">Text</span>
        <Button variant="secondary" size="md" className="w-full" onClick={() => addText()}>
          <Type className="h-4 w-4" /> Add text
        </Button>

        {selectedTextLayer && (
          <div className="mt-3 space-y-3">
            {/* Font family */}
            <div>
              <span className="text-xs text-muted-foreground">Font</span>
              <select
                value={selectedTextLayer.fontFamily}
                onChange={(e) => updateLayer(selectedTextLayer.id, { fontFamily: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <span className="text-xs text-muted-foreground">Size</span>
              <input
                type="range"
                min={8}
                max={200}
                value={selectedTextLayer.fontSize}
                onChange={(e) => updateLayer(selectedTextLayer.id, { fontSize: Number(e.target.value) })}
                className="mt-1 w-full accent-primary"
              />
              <span className="text-xs text-muted-foreground">{selectedTextLayer.fontSize}px</span>
            </div>

            {/* Style + alignment toggles — single row */}
            <div className="flex gap-1">
              <button
                onClick={() => toggleStyle('bold')}
                className={cn('rounded-md border px-2.5 py-1.5 text-sm transition-colors', hasStyle('bold') ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent')}
              ><Bold className="h-3.5 w-3.5" /></button>
              <button
                onClick={() => toggleStyle('italic')}
                className={cn('rounded-md border px-2.5 py-1.5 text-sm transition-colors', hasStyle('italic') ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent')}
              ><Italic className="h-3.5 w-3.5" /></button>

              <div className="mx-1 w-px bg-border" />

              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateLayer(selectedTextLayer.id, { align: a })}
                  className={cn('rounded-md border px-2.5 py-1.5 text-xs capitalize transition-colors', selectedTextLayer.align === a ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent')}
                >{a === 'left' ? 'L' : a === 'center' ? 'C' : 'R'}</button>
              ))}
            </div>

            {/* Color — using ColorField like background panel */}
            <ColorField label="Color" value={selectedTextLayer.fill} onChange={(fill) => updateLayer(selectedTextLayer.id, { fill })} />
          </div>
        )}
      </div>

      <div className="panel-section">
        <span className="panel-label">Stickers</span>
        <div className="mb-2 flex flex-wrap gap-1">
          {STICKER_GROUPS.map((g, i) => (
            <button
              key={g.name}
              onClick={() => setGroup(i)}
              className={`rounded px-2 py-1 text-xs ${group === i ? 'bg-primary text-primary-foreground' : 'bg-elevated text-muted-foreground hover:text-foreground'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {STICKER_GROUPS[group].emojis.map((e) => (
            <button key={e} onClick={() => addSticker(e)} className="grid aspect-square place-items-center rounded text-xl hover:bg-accent">
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
