import { Grid2x2, Image as ImageIcon, LayoutGrid, Palette, Shapes, SlidersHorizontal, Type } from 'lucide-react'
import { useEditor, type RightTab } from '@/state/store'
import { cn } from '@/lib/utils'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { StylePanel } from './panels/StylePanel'
import { BackgroundPanel } from './panels/BackgroundPanel'
import { ElementsPanel } from './panels/ElementsPanel'
import { FiltersPanel } from './panels/FiltersPanel'
import { InspectorPanel } from './panels/InspectorPanel'
import type { LayoutMode } from '@/types'

const TABS: { id: RightTab; label: string; icon: typeof Grid2x2 }[] = [
  { id: 'templates', label: 'Layout', icon: LayoutGrid },
  { id: 'background', label: 'Backdrop', icon: Palette },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
  { id: 'inspect', label: 'Edit', icon: ImageIcon },
]

export function RightPanel() {
  const tab = useEditor((s) => s.rightTab)
  const setTab = useEditor((s) => s.setRightTab)



  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-surface">
      <ModeSwitcher />

      <nav className="flex shrink-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              tab === t.id ? 'border-b-2 border-primary text-foreground' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'templates' && (
          <>
            <TemplatesPanel />
            <StylePanel />
          </>
        )}
        {tab === 'background' && <BackgroundPanel />}
        {tab === 'text' && <ElementsPanel />}
        {tab === 'elements' && <ElementsPanel />}
        {tab === 'filters' && <FiltersPanel />}
        {tab === 'inspect' && <InspectorPanel />}
      </div>
    </aside>
  )
}

function ModeSwitcher() {
  const mode = useEditor((s) => s.doc.layout.mode)
  const setMode = useEditor((s) => s.setLayoutMode)
  const modes: { id: LayoutMode; label: string; icon: typeof Grid2x2 }[] = [
    { id: 'grid', label: 'Grid', icon: Grid2x2 },
    { id: 'justified', label: 'Justified', icon: LayoutGrid },
    { id: 'freeform', label: 'Freeform', icon: Shapes },
  ]
  return (
    <div className="flex gap-1 border-b border-border p-2">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
            mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-elevated text-muted-foreground hover:text-foreground',
          )}
        >
          <m.icon className="h-3.5 w-3.5" />
          {m.label}
        </button>
      ))}
    </div>
  )
}
