import Konva from 'konva'
import type { Filter as KonvaFilter } from 'konva/lib/Node'
import type { FilterState } from '@/types'
import { DEFAULT_FILTERS } from '@/types'

/**
 * Maps our normalized FilterState onto Konva's filter pipeline. Konva applies
 * an array of filter functions plus per-filter attributes on the node, and
 * requires the node to be cached() for filters to take effect.
 */

export interface FilterPreset {
  id: string
  name: string
  values: Partial<FilterState>
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Original', values: {} },
  { id: 'mono', name: 'Mono', values: { grayscale: 1, contrast: 8 } },
  { id: 'noir', name: 'Noir', values: { grayscale: 1, contrast: 35, brightness: -0.05 } },
  { id: 'vintage', name: 'Vintage', values: { sepia: 0.6, contrast: 10, saturation: -0.4 } },
  { id: 'warm', name: 'Warm', values: { saturation: 0.6, hue: 12, brightness: 0.04 } },
  { id: 'cool', name: 'Cool', values: { saturation: 0.3, hue: 200, brightness: 0.02 } },
  { id: 'vivid', name: 'Vivid', values: { saturation: 1.4, contrast: 18 } },
  { id: 'fade', name: 'Fade', values: { contrast: -18, brightness: 0.08, saturation: -0.3 } },
  { id: 'invert', name: 'Invert', values: { invert: 1 } },
]

/** Whether any adjustment differs from the identity (so we can skip caching). */
export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.brightness !== 0 ||
    f.contrast !== 0 ||
    f.saturation !== 0 ||
    f.hue !== 0 ||
    f.blur !== 0 ||
    f.grayscale !== 0 ||
    f.sepia !== 0 ||
    f.invert !== 0
  )
}

/** Build the Konva filter function list for the active adjustments. */
export function konvaFilters(f: FilterState): KonvaFilter[] {
  const list: KonvaFilter[] = []
  if (f.brightness !== 0) list.push(Konva.Filters.Brighten)
  if (f.contrast !== 0) list.push(Konva.Filters.Contrast)
  if (f.saturation !== 0 || f.hue !== 0) list.push(Konva.Filters.HSL)
  if (f.blur !== 0) list.push(Konva.Filters.Blur)
  if (f.grayscale > 0) list.push(Konva.Filters.Grayscale)
  if (f.sepia > 0) list.push(Konva.Filters.Sepia)
  if (f.invert > 0) list.push(Konva.Filters.Invert)
  return list
}

/** Konva node attributes for the active adjustments. */
export function konvaFilterAttrs(f: FilterState): Record<string, number> {
  return {
    brightness: f.brightness,
    contrast: f.contrast,
    saturation: f.saturation,
    hue: f.hue,
    blurRadius: f.blur,
  }
}

export function applyPreset(base: FilterState, preset: FilterPreset): FilterState {
  return { ...DEFAULT_FILTERS, ...base, ...preset.values, ...resetUnset(preset) }
}

// When applying a preset, fields it doesn't mention reset to default so presets
// are predictable (not additive on top of a prior preset).
function resetUnset(preset: FilterPreset): Partial<FilterState> {
  const out: Partial<FilterState> = {}
  ;(Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).forEach((k) => {
    if (!(k in preset.values)) out[k] = DEFAULT_FILTERS[k]
  })
  return out
}
