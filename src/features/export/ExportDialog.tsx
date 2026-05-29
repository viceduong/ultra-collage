import { useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { useEditor } from '@/state/store'
import { exportCollage } from './exportCollage'

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useEditor((s) => s.doc)
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [scale, setScale] = useState(1)
  const [quality, setQuality] = useState(0.92)
  const [transparent, setTransparent] = useState(false)
  const [busy, setBusy] = useState(false)

  const outW = Math.round(doc.canvas.width * scale)
  const outH = Math.round(doc.canvas.height * scale)

  const run = async () => {
    setBusy(true)
    try {
      await exportCollage(doc, { format, scale, quality, transparent })
      onClose()
    } catch (err) {
      alert(`Export failed: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 animate-fade-in" onMouseDown={onClose}>
      <div
        className="w-[420px] animate-slide-up rounded-xl border border-border bg-surface p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Export collage</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <span className="panel-label">Format</span>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['png', 'jpeg'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`rounded-md border px-3 py-2 text-sm font-medium uppercase transition-colors ${
                format === f ? 'border-primary bg-primary/15 text-foreground' : 'border-border hover:bg-accent'
              }`}
            >
              {f === 'jpeg' ? 'JPG' : 'PNG'}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <Slider label="Resolution scale" min={1} max={4} step={0.5} value={scale} unit="×" onChange={setScale} />
          <p className="mt-1 text-xs text-muted-foreground">
            Output: {outW} × {outH} px
          </p>
        </div>

        {format === 'jpeg' && (
          <div className="mb-4">
            <Slider label="JPG quality" min={0.5} max={1} step={0.01} value={quality} onChange={setQuality} />
          </div>
        )}

        {format === 'png' && (
          <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="accent-primary" />
            Transparent background
          </label>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? 'Rendering…' : 'Download'}
        </Button>
      </div>
    </div>
  )
}
