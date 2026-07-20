/**
 * Tauri platform detection and API wrappers.
 * Provides a unified interface that works both in the browser (dev)
 * and inside Tauri (desktop). All Tauri-specific imports are lazy
 * so browser code never chokes on missing modules.
 */

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ── Lazy imports ─────────────────────────────────────────────────────────────

let tauriCore: typeof import('@tauri-apps/api/core') | null = null;
let tauriDialog: typeof import('@tauri-apps/plugin-dialog') | null = null;
let tauriFs: typeof import('@tauri-apps/plugin-fs') | null = null;

async function ensureTauri() {
  if (tauriCore) return;
  tauriCore = await import('@tauri-apps/api/core');
  tauriDialog = await import('@tauri-apps/plugin-dialog');
  tauriFs = await import('@tauri-apps/plugin-fs');
}

// ── File dialogs ─────────────────────────────────────────────────────────────

export async function openFileDialog(opts: {
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string[] | null> {
  if (!isTauri()) return null;
  await ensureTauri();
  const selected = await tauriDialog!.open({
    multiple: opts.multiple ?? false,
    filters: opts.filters ?? [{ name: 'All Files', extensions: ['*'] }],
  });
  if (!selected) return null;
  return Array.isArray(selected) ? selected : [selected];
}

export async function saveFileDialog(opts: {
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | null> {
  if (!isTauri()) return null;
  await ensureTauri();
  return await tauriDialog!.save({
    defaultPath: opts.defaultPath,
    filters: opts.filters ?? [{ name: 'All Files', extensions: ['*'] }],
  });
}

// ── File read / write ────────────────────────────────────────────────────────

export async function readTextFile(path: string): Promise<string> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  return await tauriFs!.readTextFile(path);
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  await tauriFs!.writeTextFile(path, contents);
}

export async function readFile(path: string): Promise<Uint8Array> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  return await tauriFs!.readFile(path);
}

export async function writeFile(path: string, contents: Uint8Array): Promise<void> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  await tauriFs!.writeFile(path, contents);
}

export async function exists(path: string): Promise<boolean> {
  if (!isTauri()) return false;
  await ensureTauri();
  return await tauriFs!.exists(path);
}

export async function removeFile(path: string): Promise<void> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  await tauriFs!.remove(path);
}

export async function mkdir(path: string): Promise<void> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  await tauriFs!.mkdir(path);
}

// ── Image info (via Rust backend for thumbnails) ─────────────────────────────

export interface TauriImageInfo {
  width: number;
  height: number;
  mime: string;
  thumbnail: string; // base64 data URL
}

export async function readImageInfo(path: string): Promise<TauriImageInfo> {
  if (!isTauri()) throw new Error('Tauri not available');
  await ensureTauri();
  return await tauriCore!.invoke('read_image_info', { path });
}
