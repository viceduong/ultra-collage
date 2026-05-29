import { Slider } from '@/components/ui/Slider'
import { useEditor } from '@/state/store'
import { applyPreset, FILTER_PRESETS } from '@/features/filters/filters'
import { DEFAULT_FILTERS } from '@/types'
import { cn } from '@/lib/utils'

/** Adjustments applied uniformly to all grid cells, plus one-tap presets. */
export function FiltersPanel() {
  const filters = useEditor((s) => s.doc.style.cellFilters)
  const setCellFilters = useEditor((s) => s.setCellFilters)

  return (
    <div>
      <div className="panel-section">
        <span className="panel-label">Presets</span>
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setCellFilters(applyPreset(filters, p))}
              className={cn(
                'rounded-md border border-border bg-elevated px-1 py-2 text-xs transition-colors hover:border-primary',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section space-y-4">
        <div className="flex items-center justify-between">
          <span className="panel-label !mb-0">Adjustments</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setCellFilters({ ...DEFAULT_FILTERS })}
          >
            Reset
          </button>
        </div>
        <Slider label="Brightness" min={-0.6} max={0.6} step={0.02} value={filters.brightness} onChange={(brightness) => setCellFilters({ brightness })} />
        <Slider label="Contrast" min={-60} max={60} value={filters.contrast} onChange={(contrast) => setCellFilters({ contrast })} />
        <Slider label="Saturation" min={-2} max={3} step={0.05} value={filters.saturation} onChange={(saturation) => setCellFilters({ saturation })} />
        <Slider label="Hue" min={0} max={360} value={filters.hue} unit="°" onChange={(hue) => setCellFilters({ hue })} />
        <Slider label="Blur" min={0} max={20} value={filters.blur} unit="px" onChange={(blur) => setCellFilters({ blur })} />
        <Slider label="Grayscale" min={0} max={1} step={0.05} value={filters.grayscale} onChange={(grayscale) => setCellFilters({ grayscale })} />
        <Slider label="Sepia" min={0} max={1} step={0.05} value={filters.sepia} onChange={(sepia) => setCellFilters({ sepia })} />
      </div>
    </div>
  )
}
