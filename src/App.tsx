import { useEffect, useRef, useState } from 'react'
import { TopBar } from './app/TopBar'
import { LeftPanel } from './app/LeftPanel'
import { RightPanel } from './app/RightPanel'
import { CollageStage } from './canvas/CollageStage'
import { useAutosave } from './state/useAutosave'
import { useKeyboard } from './lib/useKeyboard'
import { useEditor } from './state/store'
import { isTauri } from './lib/tauri'
import { ingestFilePaths } from './features/images/useImages'

// ── Save-confirm modal (3-button: Save / Don't Save / Cancel) ────────────

type SaveChoice = 'save' | 'discard' | 'cancel'

let pendingSaveChoice: ((c: SaveChoice) => void) | null = null

export function triggerSaveConfirm(): Promise<SaveChoice> {
  return new Promise((resolve) => {
    pendingSaveChoice = resolve
  })
}

export default function App() {
  useAutosave()
  useKeyboard()
  const hydrated = useEditor((s) => s.hydrated)
  const autoFill = useEditor((s) => s.autoFillFromAssets)
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Tauri: handle file drops + close confirmation
  const listenRef = useRef(false)
  useEffect(() => {
    if (!isTauri() || listenRef.current) return
    listenRef.current = true

    const unlisteners: (() => void)[] = []

    import('@tauri-apps/api/event')
      .then(async ({ listen }) => {
        const unsub = await listen<string[]>('tauri://file-drop', async (event) => {
          const ids = await ingestFilePaths(event.payload)
          if (ids.length) autoFill(ids)
        })
        unlisteners.push(unsub)
      })
      .catch(console.error)

    // Close handler: listen for save-dialog event from Rust backend.
    // Rust calls api.prevent_close() then emits this event.
    import('@tauri-apps/api/event')
      .then(async ({ listen }) => {
        const unsub = await listen('save-dialog', async () => {
          setShowSaveModal(true)
          const choice = await triggerSaveConfirm()
          setShowSaveModal(false)

          if (choice === 'cancel') return

          if (choice === 'save') {
            const { saveDoc } = await import('@/state/persistence')
            const doc = useEditor.getState().doc
            await saveDoc(doc)
          }

          // Tell Rust to destroy() the window (no more CloseRequested loops).
          const { invoke } = await import('@tauri-apps/api/core')
          await invoke('close_app')
        })
        unlisteners.push(unsub)
      })
      .catch(console.error)

    return () => {
      unlisteners.forEach((fn) => fn())
    }
  }, [autoFill])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="relative min-w-0 flex-1">
          <CollageStage />

          {!hydrated && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
              <span className="text-sm text-muted-foreground">Loading your collage…</span>
            </div>
          )}
        </main>
        <RightPanel />
      </div>

      {showSaveModal && (
        <SaveConfirmModal />
      )}
    </div>
  )
}

function SaveConfirmModal() {
  const [busy, setBusy] = useState(false)

  const handle = (choice: SaveChoice) => {
    if (busy) return
    setBusy(true)
    pendingSaveChoice?.(choice)
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 animate-fade-in">
      <div className="w-[380px] animate-slide-up rounded-xl border border-border bg-surface p-5 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold">Save changes?</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Your collage has unsaved changes.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handle('save')}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => handle('discard')}
            className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Don't save
          </button>
          <button
            onClick={() => handle('cancel')}
            className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
