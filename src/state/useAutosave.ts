import { useEffect, useRef } from 'react'
import { useEditor } from './store'
import { loadDoc, saveDoc } from './persistence'
import { debounce } from '@/lib/utils'

/**
 * Hydrates the document from IndexedDB on mount and autosaves (debounced) on
 * every document change. Selection/view/tool changes don't trigger a save
 * because we subscribe specifically to `doc`.
 */
export function useAutosave() {
  const setHydrated = useEditor((s) => s.setHydrated)
  const loadDocAction = useEditor((s) => s.loadDoc)
  const hydratedRef = useRef(false)

  // Load once on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const doc = await loadDoc()
        if (!cancelled && doc) loadDocAction(doc)
      } finally {
        if (!cancelled) {
          hydratedRef.current = true
          setHydrated(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadDocAction, setHydrated])

  // Autosave on document changes.
  useEffect(() => {
    const save = debounce((doc: Parameters<typeof saveDoc>[0]) => void saveDoc(doc), 600)
    const unsub = useEditor.subscribe((state, prev) => {
      if (!hydratedRef.current) return
      if (state.doc !== prev.doc) save(state.doc)
    })
    return () => {
      save.cancel()
      unsub()
    }
  }, [])
}
