import { useRef, useState, useCallback } from 'react'
import { Download, FilePlus2, FolderOpen, Redo2, Save, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { useEditor, useTemporal } from '@/state/store'
import {
  exportProject,
  importProject,
  openProjectFromDisk,
  saveProjectToDisk,
} from '@/state/persistence'
import { isTauri } from '@/lib/tauri'
import { saveAs } from 'file-saver'
import { ExportDialog } from '@/features/export/ExportDialog'

export function TopBar() {
  const name = useEditor((s) => s.doc.name)
  const setName = useEditor((s) => s.setName)
  const newDoc = useEditor((s) => s.newDoc)
  const loadDoc = useEditor((s) => s.loadDoc)
  const doc = useEditor((s) => s.doc)
  const [showExport, setShowExport] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { undo, redo } = useTemporal.getState()
  const canUndo = useTemporal((s) => s.pastStates.length > 0)
  const canRedo = useTemporal((s) => s.futureStates.length > 0)

  const onSaveProject = useCallback(async () => {
    if (isTauri()) {
      await saveProjectToDisk(doc)
    } else {
      const blob = await exportProject(doc)
      saveAs(blob, `${(doc.name || 'collage').replace(/[^\w\-]+/g, '_')}.collage.json`)
    }
  }, [doc])

  const onOpenProject = useCallback(async (file?: File) => {
    if (isTauri()) {
      const loaded = await openProjectFromDisk()
      if (loaded) loadDoc(loaded)
      return
    }
    if (!file) return
    try {
      const loaded = await importProject(file)
      loadDoc(loaded)
    } catch (err) {
      alert(`Could not open project: ${(err as Error).message}`)
    }
  }, [loadDoc])

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
      <div className="flex items-center gap-2 pr-1">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <span className="text-sm font-bold">UC</span>
        </div>
        <span className="hidden text-sm font-semibold sm:block">Ultra Collage</span>
      </div>

      <div className="h-6 w-px bg-border" />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-48 rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
        spellCheck={false}
      />

      <div className="ml-1 flex items-center gap-0.5">
        <Tooltip label="Undo (Ctrl+Z)">
          <Button variant="ghost" size="icon" disabled={!canUndo} onClick={() => undo()}>
            <Undo2 className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Shift+Z)">
          <Button variant="ghost" size="icon" disabled={!canRedo} onClick={() => redo()}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip label="New collage">
          <Button variant="ghost" size="icon" onClick={() => confirm('Start a new collage? Unsaved changes will be lost.') && newDoc()}>
            <FilePlus2 className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Open project (.collage.json)">
          <Button variant="ghost" size="icon" onClick={() => {
            if (isTauri()) {
              onOpenProject()
            } else {
              fileRef.current?.click()
            }
          }}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Save project file">
          <Button variant="ghost" size="icon" onClick={onSaveProject}>
            <Save className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Button variant="primary" size="md" onClick={() => setShowExport(true)}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onOpenProject(f)
          e.target.value = ''
        }}
      />
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </header>
  )
}
