import { useCallback } from 'react'
import { newId } from '@/lib/id'
import { useEditor } from '@/state/store'
import { putBlob } from '@/state/persistence'
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
 */
export function useImageIngest() {
  const addAsset = useEditor((s) => s.addAsset)

  return useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
      const ids: string[] = []
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
