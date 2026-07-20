import { Slider } from '@/components/ui/Slider'
import { useEditor } from '@/state/store'
import type { CellShape } from '@/types'

const SHAPES: { id: CellShape; label: string; icon: string }[] = [
  { id: 'rounded', label: 'Rounded', icon: '▢' },
  { id: 'circle', label: 'Circle', icon: '⬭' },
  { id: 'diamond', label: 'Diamond', icon: '◇' },
  { id: 'hexagon', label: 'Hexagon', icon: '⬡' },
  { id: 'octagon', label: 'Octagon', icon: '⯃' },
  { id: 'heart', label: 'Heart', icon: '♥' },
  { id: 'drop', label: 'Drop', icon: '💧' },
  { id: 'pill', label: 'Pill', icon: '⏤' },
]

/** Spacing / padding / corner-radius / shape controls for the grid. */
export function StylePanel() {
  const style = useEditor((s) => s.doc.style)
  const setStyle = useEditor((s) => s.setStyle)

  return (
    <div className="panel-section space-y-4">
      <span className="panel-label">Cell shape</span>
      <div className="grid grid-cols-4 gap-1.5">
        {SHAPES.map((s) => {
          const active = style.shape === s.id
          return (
            <button
              key={s.id}
              onClick={() => setStyle({ shape: s.id })}
              title={s.label}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-xs transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className="text-lg leading-none">{s.icon}</span>
              <span className="text-[10px]">{s.label}</span>
            </button>
          )
        })}
      </div>

      <span className="panel-label">Layout style</span>
      <Slider label="Spacing" min={0} max={80} value={style.spacing} unit="px" onChange={(spacing) => setStyle({ spacing })} />
      <Slider label="Outer margin" min={0} max={120} value={style.outerPadding} unit="px" onChange={(outerPadding) => setStyle({ outerPadding })} />
      <Slider label="Corner radius" min={0} max={120} value={style.cornerRadius} unit="px" onChange={(cornerRadius) => setStyle({ cornerRadius })} />
    </div>
  )
}
