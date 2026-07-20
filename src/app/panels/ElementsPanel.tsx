import { useState } from 'react'
import { Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useEditor } from '@/state/store'
import { newId } from '@/lib/id'
import { STICKER_GROUPS } from '@/data/stickers'
import type { StickerLayer } from '@/types'

/** Add text layers and emoji stickers as free layers. */
export function ElementsPanel() {
  const addText = useEditor((s) => s.addText)
  const addLayer = useEditor((s) => s.addLayer)
  const canvas = useEditor((s) => s.doc.canvas)
  const [group, setGroup] = useState(0)

  const center = () => ({ x: canvas.width / 2 - 80, y: canvas.height / 2 - 80 })

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
