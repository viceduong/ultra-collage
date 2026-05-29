import { useEffect } from 'react'
import { useEditor, useTemporal } from '@/state/store'

/** Global editor keyboard shortcuts. Ignores events while typing in inputs. */
export function useKeyboard() {
  const selection = useEditor((s) => s.selection)
  const removeLayer = useEditor((s) => s.removeLayer)
  const removeCellAt = useEditor((s) => s.removeCellAt)
  const duplicateLayer = useEditor((s) => s.duplicateLayer)
  const clearCell = useEditor((s) => s.clearCell)
  const updateLayer = useEditor((s) => s.updateLayer)
  const select = useEditor((s) => s.select)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const mod = e.ctrlKey || e.metaKey
      const temporal = useTemporal.getState()

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) temporal.redo()
        else temporal.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        temporal.redo()
        return
      }

      // Esc clears the current selection.
      if (e.key === 'Escape' && selection.kind !== 'none') {
        e.preventDefault()
        select({ kind: 'none' })
        return
      }

      if (selection.kind === 'layer') {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          removeLayer(selection.id)
        } else if (mod && e.key.toLowerCase() === 'd') {
          e.preventDefault()
          duplicateLayer(selection.id)
        } else if (e.key.startsWith('Arrow')) {
          e.preventDefault()
          const layer = useEditor.getState().doc.freeLayers.find((l) => l.id === selection.id)
          if (!layer) return
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
          updateLayer(selection.id, { x: layer.x + dx, y: layer.y + dy })
        }
      } else if (selection.kind === 'cell') {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          if (e.shiftKey) removeCellAt(selection.id)
          else clearCell(selection.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, removeLayer, removeCellAt, duplicateLayer, clearCell, updateLayer, select])
}
