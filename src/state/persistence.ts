import { get, set, del, createStore } from 'idb-keyval'
import type { AssetId, CollageDoc, ImageAsset } from '@/types'

/**
 * Client-only persistence. The document JSON and the raw image blobs are stored
 * separately in IndexedDB: the JSON is small and serializable, while blobs are
 * large and must be re-hydrated into fresh object URLs on load (object URLs do
 * not survive a reload).
 */

const docStore = createStore('ultra-collage', 'documents')
const blobStore = createStore('ultra-collage-blobs', 'blobs')

const CURRENT_DOC_KEY = 'current'

// ── blobs ────────────────────────────────────────────────────────────────────

export async function putBlob(id: AssetId, blob: Blob): Promise<void> {
  await set(id, blob, blobStore)
}

export async function getBlob(id: AssetId): Promise<Blob | undefined> {
  return get<Blob>(id, blobStore)
}

export async function deleteBlob(id: AssetId): Promise<void> {
  await del(id, blobStore)
}

// ── document ──────────────────────────────────────────────────────────────────

/** Serializable form of an asset: drop the runtime object URL. */
type StoredAsset = Omit<ImageAsset, 'url'>

interface StoredDoc extends Omit<CollageDoc, 'assets'> {
  assets: Record<AssetId, StoredAsset>
}

export async function saveDoc(doc: CollageDoc): Promise<void> {
  const stored: StoredDoc = {
    ...doc,
    updatedAt: Date.now(),
    assets: Object.fromEntries(
      Object.entries(doc.assets).map(([id, a]) => {
        const { url: _url, ...rest } = a
        return [id, rest]
      }),
    ),
  }
  await set(CURRENT_DOC_KEY, stored, docStore)
}

/** Load the persisted document and re-create object URLs from stored blobs. */
export async function loadDoc(): Promise<CollageDoc | null> {
  const stored = await get<StoredDoc>(CURRENT_DOC_KEY, docStore)
  if (!stored) return null
  return rehydrate(stored)
}

async function rehydrate(stored: StoredDoc): Promise<CollageDoc> {
  const assets: Record<AssetId, ImageAsset> = {}
  for (const [id, a] of Object.entries(stored.assets)) {
    const blob = await getBlob(id)
    assets[id] = { ...a, url: blob ? URL.createObjectURL(blob) : '' }
  }
  return { ...stored, assets }
}

// ── project import / export (portable single file) ────────────────────────────

interface ProjectFile {
  format: 'ultra-collage'
  version: 1
  doc: StoredDoc
  blobs: Record<AssetId, string> // data URLs
}

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })

const dataURLToBlob = async (dataUrl: string): Promise<Blob> => (await fetch(dataUrl)).blob()

export async function exportProject(doc: CollageDoc): Promise<Blob> {
  const blobs: Record<AssetId, string> = {}
  for (const id of Object.keys(doc.assets)) {
    const blob = await getBlob(id)
    if (blob) blobs[id] = await blobToDataURL(blob)
  }
  const project: ProjectFile = {
    format: 'ultra-collage',
    version: 1,
    doc: {
      ...doc,
      assets: Object.fromEntries(
        Object.entries(doc.assets).map(([id, a]) => {
          const { url: _url, ...rest } = a
          return [id, rest]
        }),
      ),
    },
    blobs,
  }
  return new Blob([JSON.stringify(project)], { type: 'application/json' })
}

export async function importProject(file: File): Promise<CollageDoc> {
  const project = JSON.parse(await file.text()) as ProjectFile
  if (project.format !== 'ultra-collage') throw new Error('Not an Ultra Collage project file')
  // Restore blobs into IndexedDB and re-create object URLs.
  for (const [id, dataUrl] of Object.entries(project.blobs)) {
    const blob = await dataURLToBlob(dataUrl)
    await putBlob(id, blob)
  }
  return rehydrate(project.doc)
}
