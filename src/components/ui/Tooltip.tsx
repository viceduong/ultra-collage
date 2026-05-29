import { type ReactNode } from 'react'

/** Minimal CSS-only tooltip wrapper (no portal needed for our toolbar use). */
export function Tooltip({ label, children, side = 'bottom' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/tt:opacity-100 ${
          side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
        }`}
      >
        {label}
      </span>
    </span>
  )
}
