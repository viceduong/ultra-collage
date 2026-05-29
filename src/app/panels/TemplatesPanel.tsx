import { useState } from 'react'
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from '@/layout/templates'
import { ASPECT_PRESETS } from '@/types'
import { useEditor } from '@/state/store'
import { computeLayout } from '@/layout/geometry'
import { cn } from '@/lib/utils'

/** Template picker (mini split-tree previews) + canvas size presets. */
export function TemplatesPanel() {
  const applyTemplate = useEditor((s) => s.applyTemplate)
  const setCanvasSize = useEditor((s) => s.setCanvasSize)
  const canvas = useEditor((s) => s.doc.canvas)
  const [cat, setCat] = useState<Template['category']>('grid')

  return (
    <div>
      <div className="panel-section">
        <span className="panel-label">Canvas size</span>
        <div className="grid grid-cols-2 gap-1.5">
          {ASPECT_PRESETS.map((p) => {
            const active = canvas.width === p.w && canvas.height === p.h
            return (
              <button
                key={p.label}
                onClick={() => setCanvasSize(p.w, p.h)}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                  active ? 'border-primary bg-primary/15' : 'border-border hover:bg-accent',
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <NumInput value={canvas.width} onChange={(w) => setCanvasSize(w, canvas.height)} />
          <span className="text-muted-foreground">×</span>
          <NumInput value={canvas.height} onChange={(h) => setCanvasSize(canvas.width, h)} />
        </div>
      </div>

      <div className="panel-section">
        <span className="panel-label">Layouts</span>
        <div className="mb-3 flex gap-1 rounded-lg bg-elevated p-1">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                cat === c.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.filter((t) => t.category === cat).map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.build())}
              className="group aspect-square rounded-md border border-border bg-elevated p-1.5 transition-colors hover:border-primary"
              title={t.name}
            >
              <TemplatePreview template={t} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplatePreview({ template }: { template: Template }) {
  const size = 56
  const tree = template.build()
  const { cells } = computeLayout(tree, { x: 0, y: 0, width: size, height: size }, { spacing: 3 })
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {cells.map((c) => (
        <rect
          key={c.id}
          x={c.rect.x}
          y={c.rect.y}
          width={c.rect.width}
          height={c.rect.height}
          rx={2}
          className="fill-muted-foreground/40 group-hover:fill-primary/70"
        />
      ))}
    </svg>
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
      className="w-full rounded-md border border-border bg-elevated px-2 py-1 text-xs tabular-nums focus:border-ring focus:outline-none"
    />
  )
}
