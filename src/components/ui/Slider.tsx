import { useId } from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  label?: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  className?: string
}

/** Labeled range input with a live value readout, styled for the dark panels. */
export function Slider({ label, value, min, max, step = 1, unit = '', onChange, className }: SliderProps) {
  const id = useId()
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
            {label}
          </label>
          <span className="tabular-nums text-xs text-foreground">
            {Math.round(value * 100) / 100}
            {unit}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110"
      />
    </div>
  )
}
