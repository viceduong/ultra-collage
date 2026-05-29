import { useState } from 'react'
import { Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useEditor } from '@/state/store'
import { newId } from '@/lib/id'
import { SHAPES, STICKER_GROUPS } from '@/data/stickers'
import type { ShapeLayer, StickerLayer } from '@/types'

/** Add text, shapes, and emoji stickers as free layers. */
export function ElementsPanel() {
  const addText = useEditor((s) => s.addText)
  const addLayer = useEditor((s) => s.addLayer)
  const canvas = useEditor((s) => s.doc.canvas)
  const [group, setGroup] = useState(0)

  const center = () => ({ x: canvas.width / 2 - 80, y: canvas.height / 2 - 80 })

  const addShape = (shape: ShapeLayer['shape']) => {
    const c = center()
    const layer: ShapeLayer = {
      id: newId('layer'),
      type: 'shape',
      shape,
      x: c.x,
      y: c.y,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#6366f1',
      strokeWidth: 0,
      cornerRadius: shape === 'rect' ? 16 : 0,
    }
    addLayer(layer)
  }

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
        <Button variant="secondary" size="md" className="w-full" onClick={() => addText()}>
          <Type className="h-4 w-4" /> Add text
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => addText({ text: 'Heading', fontSize: 96, fontStyle: 'bold' })}>
            Heading
          </Button>
          <Button variant="outline" size="sm" onClick={() => addText({ text: 'Subtitle', fontSize: 48, fontStyle: 'normal' })}>
            Subtitle
          </Button>
        </div>
      </div>

      <div className="panel-section">
        <span className="panel-label">Shapes</span>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.kind}
              onClick={() => addShape(s.kind)}
              className="grid aspect-square place-items-center rounded-md border border-border bg-elevated hover:border-primary"
              title={s.label}
            >
              <ShapeGlyph kind={s.kind} />
            </button>
          ))}
        </div>
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

function ShapeGlyph({ kind }: { kind: ShapeLayer['shape'] }) {
  const cls = 'fill-muted-foreground'
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      {kind === 'rect' && <rect x="3" y="5" width="18" height="14" rx="3" className={cls} />}
      {kind === 'ellipse' && <circle cx="12" cy="12" r="9" className={cls} />}
      {kind === 'triangle' && <polygon points="12,3 22,21 2,21" className={cls} />}
      {kind === 'star' && <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" className={cls} />}
      {kind === 'heart' && <path d="M12 21s-8-5-8-11a4 4 0 018-1 4 4 0 018 1c0 6-8 11-8 11z" className={cls} />}
      {kind === 'line' && <rect x="3" y="11" width="18" height="2.5" rx="1.25" className={cls} />}
    </svg>
  )
}
