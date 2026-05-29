import { TopBar } from './app/TopBar'
import { LeftPanel } from './app/LeftPanel'
import { RightPanel } from './app/RightPanel'
import { CollageStage } from './canvas/CollageStage'
import { useAutosave } from './state/useAutosave'
import { useKeyboard } from './lib/useKeyboard'
import { useEditor } from './state/store'

export default function App() {
  useAutosave()
  useKeyboard()
  const hydrated = useEditor((s) => s.hydrated)
  const mode = useEditor((s) => s.doc.layout.mode)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="relative min-w-0 flex-1">
          <CollageStage />
          {mode === 'freeform' && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-elevated/90 px-3 py-1 text-xs text-muted-foreground shadow">
              Freeform — add photos as elements and arrange them anywhere
            </div>
          )}
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
