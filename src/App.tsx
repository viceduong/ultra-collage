import { useEffect, useRef } from 'react'
import { TopBar } from './app/TopBar'
import { LeftPanel } from './app/LeftPanel'
import { RightPanel } from './app/RightPanel'
import { CollageStage } from './canvas/CollageStage'
import { useAutosave } from './state/useAutosave'
import { useKeyboard } from './lib/useKeyboard'
import { useEditor } from './state/store'
import { isTauri } from './lib/tauri'
import { ingestFilePaths } from './features/images/useImages'

export default function App() {
  useAutosave()
  useKeyboard()
  const hydrated = useEditor((s) => s.hydrated)
  const autoFill = useEditor((s) => s.autoFillFromAssets)

  // Tauri: handle file drops + close-with-save
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

    import('@tauri-apps/api/window')
      .then(async ({ getCurrentWindow }) => {
        const unsub = await getCurrentWindow().onCloseRequested(async (event) => {
          // Check if there's an autosave (document has unsaved changes)
          const { ask } = await import('@tauri-apps/plugin-dialog')
          const save = await ask('Save your collage before closing?', {
            title: 'Ultra Collage',
            kind: 'warning',
            cancelLabel: 'Cancel',
            okLabel: 'Save & close',
          })
          if (save) {
            // Trigger autosave then allow close
            const { saveDoc } = await import('@/state/persistence')
            const doc = useEditor.getState().doc
            await saveDoc(doc)
            event.preventDefault()
            // Close after save completes
            await getCurrentWindow().close()
          } else {
            // Don't save, just close
          }
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
    </div>
  )
}
