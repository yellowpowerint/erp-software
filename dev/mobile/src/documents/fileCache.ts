import { cacheDirectory, documentDirectory, getInfoAsync, makeDirectoryAsync } from 'expo-file-system/legacy';

function safeExtensionFromMime(mimeType: string | undefined): string {
  const mt = (mimeType ?? '').toLowerCase();
  if (mt.includes('pdf')) return 'pdf';
  if (mt.includes('png')) return 'png';
  if (mt.includes('jpeg') || mt.includes('jpg')) return 'jpg';
  if (mt.includes('gif')) return 'gif';
  if (mt.includes('heic')) return 'heic';
  return 'bin';
}

export function getDocumentCachePath(params: { id: string; mimeType?: string; filename?: string }) {
  const ext = safeExtensionFromMime(params.mimeType);
  const base = params.filename ? params.filename.replace(/[^a-zA-Z0-9._-]/g, '_') : params.id;
  const name = `${base}-${params.id}.${ext}`;
  return `${cacheDirectory ?? documentDirectory ?? ''}${name}`;
}

export async function ensureCacheDirReady() {
  const dir = cacheDirectory ?? documentDirectory;
  if (!dir) return;
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
}
