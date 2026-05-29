import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'

interface ColorFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Swatch + popover hex picker (react-colorful). Closes on outside click. */
export function ColorField({ label, value, onChange, className }: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && <span className="panel-label">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-elevated px-2 py-1.5 text-left hover:border-ring"
      >
        <span
          className="h-5 w-5 shrink-0 rounded border border-black/20 checkerboard"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs uppercase tabular-nums text-foreground">{value}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 animate-slide-up rounded-lg border border-border bg-elevated p-3 shadow-2xl">
          <HexColorPicker color={value} onChange={onChange} />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs uppercase text-foreground focus:border-ring focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
