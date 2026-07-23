import { useCallback, useEffect, useRef, useState } from 'react'
import { Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ColorField } from '@/components/ui/ColorField'
import { Slider } from '@/components/ui/Slider'
import { useEditor } from '@/state/store'
import { newId } from '@/lib/id'
import { STICKER_GROUPS, FONT_FAMILIES, SOLID_PRESETS, GRADIENT_PRESETS } from '@/data/stickers'
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

  const handleAddText = () => { addText() }

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const focusRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el) {
      el.focus()
      requestAnimationFrame(() => el.select())
    }
  }, [])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.focus()
      ta.select()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextLayer?.id, selection])

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

  return (
    <div>
      <div className="panel-section">
        <span className="panel-label">Text</span>
        <Button variant="secondary" size="md" className="w-full" onClick={handleAddText}>
          <Type className="h-4 w-4" /> Add text
        </Button>

        {selectedTextLayer && (
          <div className="mt-3 space-y-4">
            {/* Inline text editor */}
            <textarea
              key={selectedTextLayer.id}
              ref={focusRef}
              value={selectedTextLayer.text}
              onChange={(e) => updateLayer(selectedTextLayer.id, { text: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-elevated px-2 py-1.5 text-sm focus:border-ring focus:outline-none"
            />

            {/* ── Text style ── */}
            <div className="space-y-3">
              <span className="panel-label !mb-0">Font</span>
              <select
                value={selectedTextLayer.fontFamily}
                onChange={(e) => updateLayer(selectedTextLayer.id, { fontFamily: e.target.value })}
                className="w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm focus:border-ring focus:outline-none"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedTextLayer.fontStyle ?? 'normal'}
                  onChange={(e) => updateLayer(selectedTextLayer.id, { fontStyle: e.target.value as TextLayer['fontStyle'] })}
                  className="rounded-md border border-border bg-elevated px-2 py-1.5 text-sm focus:border-ring focus:outline-none"
                >
                  <option value="normal">Regular</option>
                  <option value="bold">Bold</option>
                  <option value="italic">Italic</option>
                  <option value="italic bold">Bold Italic</option>
                </select>
                <select
                  value={selectedTextLayer.align ?? 'left'}
                  onChange={(e) => updateLayer(selectedTextLayer.id, { align: e.target.value as TextLayer['align'] })}
                  className="rounded-md border border-border bg-elevated px-2 py-1.5 text-sm focus:border-ring focus:outline-none"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <Slider label="Size" min={12} max={240} value={selectedTextLayer.fontSize} unit="px" onChange={(fontSize) => updateLayer(selectedTextLayer.id, { fontSize })} />
              <Slider label="Letter spacing" min={-5} max={30} value={selectedTextLayer.letterSpacing} onChange={(letterSpacing) => updateLayer(selectedTextLayer.id, { letterSpacing })} />

              {/* Opacity + Rotation */}
              <Slider label="Opacity" min={0.1} max={1} step={0.05} value={selectedTextLayer.opacity} onChange={(opacity) => updateLayer(selectedTextLayer.id, { opacity })} />
              <Slider label="Rotation" min={-180} max={180} value={selectedTextLayer.rotation} unit="°" onChange={(rotation) => updateLayer(selectedTextLayer.id, { rotation })} />
            </div>

            {/* ── Color (tabbed: Color / Gradient / None) ── */}
            <div className="space-y-3">
              <span className="panel-label !mb-0">Color</span>

              <div className="flex gap-1 rounded-lg bg-elevated p-1">
                {([
                  { id: 'solid' as const, label: 'Color' },
                  { id: 'gradient' as const, label: 'Gradient' },
                ]).map((t) => {
                  const isGradient = selectedTextLayer.fill.startsWith('linear')
                  const isActive = t.id === 'solid' ? !isGradient : isGradient
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (t.id === 'solid') updateLayer(selectedTextLayer.id, { fill: '#ffffff' })
                        else updateLayer(selectedTextLayer.id, { fill: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' })
                      }}
                      className={cn(
                        'flex-1 rounded-md px-1 py-1 text-xs font-medium transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {selectedTextLayer.fill && !selectedTextLayer.fill.startsWith('linear') && (
                <div className="space-y-2">
                  <ColorField value={selectedTextLayer.fill} onChange={(fill) => updateLayer(selectedTextLayer.id, { fill })} />
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
              )}

              {selectedTextLayer.fill?.startsWith('linear') && (
                <div className="grid grid-cols-4 gap-1.5">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.from + g.to}
                      onClick={() => updateLayer(selectedTextLayer.id, { fill: `linear-gradient(135deg, ${g.from}, ${g.to})` })}
                      className="aspect-[2] rounded border border-black/20"
                      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    />
                  ))}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={!!selectedTextLayer.shadow} onChange={(e) => updateLayer(selectedTextLayer.id, { shadow: e.target.checked })} className="accent-primary" />
                Drop shadow
              </label>
            </div>

            {/* ── Background ── */}
            <div className="space-y-3">
              <span className="panel-label !mb-0">Background</span>

              <div className="flex gap-1 rounded-lg bg-elevated p-1">
                {([
                  { id: 'solid' as const, label: 'Color' },
                  { id: 'gradient' as const, label: 'Gradient' },
                  { id: 'none' as const, label: 'None' },
                ]).map((t) => {
                  const isActive =
                    t.id === 'none' ? !selectedTextLayer.background :
                    t.id === 'solid' ? (!!selectedTextLayer.background && !selectedTextLayer.background.startsWith('linear')) :
                    t.id === 'gradient' ? (!!selectedTextLayer.background?.startsWith('linear')) : false
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (t.id === 'solid') updateLayer(selectedTextLayer.id, { background: '#ffffff', backgroundPadding: 12, backgroundCornerRadius: 8 })
                        else if (t.id === 'gradient') updateLayer(selectedTextLayer.id, { background: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', backgroundPadding: 12, backgroundCornerRadius: 8 })
                        else updateLayer(selectedTextLayer.id, { background: undefined })
                      }}
                      className={cn(
                        'flex-1 rounded-md px-1 py-1 text-xs font-medium transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {selectedTextLayer.background && !selectedTextLayer.background.startsWith('linear') && (
                <div className="space-y-2">
                  <ColorField value={selectedTextLayer.background} onChange={(fill) => updateLayer(selectedTextLayer.id, { background: fill })} />
                  <div className="grid grid-cols-6 gap-1.5">
                    {SOLID_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateLayer(selectedTextLayer.id, { background: c })}
                        className="aspect-square rounded border border-black/20"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedTextLayer.background?.startsWith('linear') && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.from + g.to}
                        onClick={() => updateLayer(selectedTextLayer.id, { background: `linear-gradient(135deg, ${g.from}, ${g.to})` })}
                        className="aspect-[2] rounded border border-black/20"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                    ))}
                  </div>
                </div>
              )}
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
