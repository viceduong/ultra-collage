import { useCallback } from 'react'
import { newId } from '@/lib/id'
import { useEditor } from '@/state/store'
import { putBlob, ingestFileToAsset } from '@/state/persistence'
import { isTauri, openFileDialog } from '@/lib/tauri'
import type { ImageAsset } from '@/types'

/** Read intrinsic dimensions of an image blob via an object URL. */
function probe(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = url
  })
}

/**
 * Ingest File objects into the document: store the blob in IndexedDB, create a
 * runtime object URL, register an ImageAsset, and return the new asset ids.
 *
 * Tauri mode: opens native file dialog, reads files via Rust backend,
 * generates thumbnails server-side.
 */
export function useImageIngest() {
  const addAsset = useEditor((s) => s.addAsset)

  return useCallback(
    async (files: FileList | File[] | undefined): Promise<string[]> => {
      const ids: string[] = []

      if (isTauri()) {
        // Tauri: open native file dialog
        const paths = await openFileDialog({
          multiple: true,
          filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
          ],
        })
        if (!paths) return ids

        for (const filePath of paths) {
          const result = await ingestFileToAsset(filePath)
          if (!result) continue
          await putBlob(result.id, result.blob!)
          addAsset(result.asset)
          ids.push(result.id)
        }
        return ids
      }

      // Browser: use File objects from input
      if (!files) return ids
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
      for (const file of list) {
        const id = newId('img')
        const url = URL.createObjectURL(file)
        let dims = { width: 0, height: 0 }
        try {
          dims = await probe(url)
        } catch {
          continue
        }
        await putBlob(id, file)
        const asset: ImageAsset = {
          id,
          name: file.name,
          width: dims.width,
          height: dims.height,
          url,
          mime: file.type,
          size: file.size,
        }
        addAsset(asset)
        ids.push(id)
      }
      return ids
    },
    [addAsset],
  )
}

/**
 * Tauri-specific: drag-and-drop file handler.
 * Converts a list of absolute file paths into ImageAssets.
 */
export async function ingestFilePaths(filePaths: string[]): Promise<string[]> {
  if (!isTauri()) return []
  const ids: string[] = []
  const { addAsset } = useEditor.getState()

  for (const fp of filePaths) {
    const result = await ingestFileToAsset(fp)
    if (!result) continue
    addAsset(result.asset)
    ids.push(result.id)
  }
  return ids
}
