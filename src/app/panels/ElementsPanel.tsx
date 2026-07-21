import { useCallback, useEffect, useRef, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ColorField } from '@/components/ui/ColorField'
import { useEditor } from '@/state/store'
import { newId } from '@/lib/id'
import { STICKER_GROUPS, FONT_FAMILIES, SOLID_PRESETS } from '@/data/stickers'
import type { StickerGlyph } from '@/data/stickers'
import type { StickerLayer, TextLayer } from '@/types'
import { cn } from '@/lib/utils'

const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight } as const

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

  const handleAddText = () => { addText() }

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Stable callback ref: sync ref + focus on mount.
  const focusRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el) {
      el.focus()
      requestAnimationFrame(() => el.select())
    }
  }, [])

  // Re-select text when same layer is re-selected (selection object changes).
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.focus()
      ta.select()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextLayer?.id, selection])

  const addSticker = (glyph: StickerGlyph) => {
    const c = center()
    const layer: StickerLayer = {
      id: newId('layer'),
      type: 'sticker',
      path: glyph.path,
      fill: glyph.fill,
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
        <Button variant="secondary" size="md" className="w-full" onClick={handleAddText}>
          <Type className="h-4 w-4" /> Add text
        </Button>

        {selectedTextLayer && (
          <div className="mt-3 space-y-3">
            {/* Inline text editor */}
            <textarea
              key={selectedTextLayer.id}
              ref={focusRef}
              value={selectedTextLayer.text}
              onChange={(e) => updateLayer(selectedTextLayer.id, { text: e.target.value })}
              className="h-20 w-full resize-none rounded-md border border-border bg-elevated p-2 text-sm outline-none focus:border-primary"
              placeholder="Type here..."
            />

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

            {/* Style + alignment — evenly spaced */}
            <div className="flex gap-1">
              {[{ tag: 'bold', icon: Bold }, { tag: 'italic', icon: Italic }].map(({ tag, icon: Icon }) => (
                <button
                  key={tag}
                  onClick={() => toggleStyle(tag as 'bold' | 'italic')}
                  className={cn('flex-1 rounded-md border py-1.5 text-sm transition-colors', hasStyle(tag) ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent')}
                ><Icon className="mx-auto h-3.5 w-3.5" /></button>
              ))}
              <div className="mx-0.5 w-px bg-border" />
              {(['left', 'center', 'right'] as const).map((a) => {
                const Icon = ALIGN_ICONS[a]
                return (
                  <button
                    key={a}
                    onClick={() => updateLayer(selectedTextLayer.id, { align: a })}
                    className={cn('flex-1 rounded-md border py-1.5 text-sm transition-colors', selectedTextLayer.align === a ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent')}
                  ><Icon className="mx-auto h-3.5 w-3.5" /></button>
                )
              })}
            </div>

            {/* Color — with presets like background panel */}
            <div className="space-y-2">
              <ColorField label="Color" value={selectedTextLayer.fill} onChange={(fill) => updateLayer(selectedTextLayer.id, { fill })} />
              <div className="grid grid-cols-6 gap-1.5">
                {SOLID_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateLayer(selectedTextLayer.id, { fill: c })}
                    className="aspect-square rounded border border-black/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
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
        <div className="grid grid-cols-3 gap-1.5">
          {STICKER_GROUPS[group].stickers.map((g) => (
            <button
              key={g.id}
              onClick={() => addSticker(g)}
              className="grid aspect-square place-items-center rounded-md border border-border bg-elevated p-2 hover:border-primary transition-colors"
              title={g.label}
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8">
                <path d={g.path} fill={g.fill} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
