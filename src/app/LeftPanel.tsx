import { useRef } from 'react'
import { ImagePlus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useShallow } from 'zustand/react/shallow'
import { useEditor } from '@/state/store'
import { useImageIngest } from '@/features/images/useImages'
import { deleteBlob } from '@/state/persistence'
import { isTauri } from '@/lib/tauri'
import { formatBytes } from '@/lib/utils'

/**
 * The photo tray: upload images, then drag a thumbnail onto a cell, or
 * "Auto-fill" to drop them into empty cells in order.
 *
 * Tauri mode: uses native file dialog via @tauri-apps/plugin-dialog.
 * Browser mode: uses standard <input type="file"> for dev.
 */
export function LeftPanel() {
  const assets = useEditor(useShallow((s) => Object.values(s.doc.assets)))
  const autoFill = useEditor((s) => s.autoFillFromAssets)
  const ingest = useImageIngest()
  const fileRef = useRef<HTMLInputElement>(null)

  const onUpload = async () => {
    if (isTauri()) {
      const ids = await ingest(undefined)
      if (ids.length) autoFill(ids)
    } else {
      fileRef.current?.click()
    }
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="panel-section flex items-center justify-between">
        <span className="text-sm font-semibold">Photos</span>
        <span className="text-xs text-muted-foreground">{assets.length}</span>
      </div>

      <div className="flex gap-2 px-4 py-3">
        <Button variant="primary" size="sm" className="flex-1" onClick={onUpload}>
          <ImagePlus className="h-4 w-4" />
          Upload
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!assets.length}
          onClick={() => autoFill(assets.map((a) => a.id))}
          title="Fill empty cells with these photos"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* Browser-only file input */}
      {!isTauri() && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            if (e.target.files?.length) {
              const ids = await ingest(e.target.files)
              autoFill(ids)
            }
            e.target.value = ''
          }}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {assets.length === 0 ? (
          <label
            className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-center text-xs text-muted-foreground hover:border-ring"
            onClick={onUpload}
          >
            <ImagePlus className="h-6 w-6" />
            Drag photos here
            <span className="opacity-70">or click to browse</span>
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((a) => (
              <ThumbCard key={a.id} id={a.id} url={a.url} name={a.name} size={a.size} />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function ThumbCard({ id, url, name, size }: { id: string; url: string; name: string; size: number }) {
  const mode = useEditor((s) => s.doc.layout.mode)
  const selection = useEditor((s) => s.selection)
  const addImageLayer = useEditor((s) => s.addImageLayer)
  const assignImageToCell = useEditor((s) => s.assignImageToCell)

  const onClick = () => {
    if (mode === 'freeform') addImageLayer(id)
    else if (selection.kind === 'cell') assignImageToCell(selection.id, id)
  }

  const removeAsset = useEditor((s) => s.removeAsset)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/asset-id', id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={onClick}
      className="group relative aspect-square cursor-grab overflow-hidden rounded-md border border-border bg-elevated active:cursor-grabbing"
      title={`${name} · ${formatBytes(size)}`}
    >
      <img src={url} alt={name} className="h-full w-full object-cover" draggable={false} />
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeAsset(id)
          void deleteBlob(id)
        }}
        className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:block hover:bg-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}
