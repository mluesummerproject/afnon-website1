import 'server-only';

import { MEDIA_BUCKET, publicObjectUrl, sniffMime, type ImageMime, type VideoMime } from '@/lib/media';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function objectUrl(path: string): string {
  return publicObjectUrl(supabaseUrl, path);
}

/**
 * A one-time signed upload URL for a path the SERVER chose. The browser sends
 * the file straight to Storage (so large phone videos never pass through a
 * serverless function and its body limit) but cannot pick where it lands or
 * overwrite anything: upsert is off and the path contains a random UUID.
 */
export async function createUploadTarget(path: string): Promise<{ url: string; path: string }> {
  const { data, error } = await getSupabaseAdmin().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Could not prepare upload: ${error?.message ?? 'unknown'}`);
  return { url: data.signedUrl, path: data.path };
}

export type InspectedObject = {
  size: number;
  sniffed: ImageMime | VideoMime | null;
  createdAt: string | null;
};

/**
 * Confirms an object exists and reads its real type from its first bytes —
 * never from the name or the MIME type the browser declared.
 */
export async function inspectObject(path: string): Promise<InspectedObject | null> {
  const slash = path.lastIndexOf('/');
  const folder = path.slice(0, slash);
  const file = path.slice(slash + 1);

  const { data, error } = await getSupabaseAdmin()
    .storage.from(MEDIA_BUCKET)
    .list(folder, { limit: 100, search: file });
  if (error) return null;

  const entry = data?.find((object) => object.name === file);
  if (!entry) return null;

  let sniffed: InspectedObject['sniffed'] = null;
  try {
    const response = await fetch(objectUrl(path), {
      headers: { Range: 'bytes=0-63' },
      cache: 'no-store',
    });
    if (response.ok || response.status === 206) {
      const bytes = new Uint8Array(await response.arrayBuffer()).subarray(0, 64);
      sniffed = sniffMime(bytes);
    }
  } catch {
    sniffed = null;
  }

  return {
    size: Number((entry.metadata as { size?: number } | null)?.size ?? 0),
    sniffed,
    createdAt: entry.created_at ?? null,
  };
}

export async function removeObjects(paths: string[]): Promise<void> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return;
  const { error } = await getSupabaseAdmin().storage.from(MEDIA_BUCKET).remove(unique);
  if (error) console.error('[storage] remove failed:', error.message);
}

/**
 * Removes files inside ONE folder that no database row points to — the
 * leftovers of an upload that was started and never finished. Only touches
 * files older than `minAgeMs`, so an upload in progress is never deleted.
 */
export async function sweepOrphans(folder: string, referenced: Set<string>, minAgeMs = 60 * 60 * 1000): Promise<number> {
  const clean = folder.replace(/\/$/, '');
  const { data, error } = await getSupabaseAdmin().storage.from(MEDIA_BUCKET).list(clean, { limit: 1000 });
  if (error || !data) return 0;

  const cutoff = Date.now() - minAgeMs;
  const orphans = data
    .filter((object) => object.id) // files only, not sub-folders
    .map((object) => ({ path: `${clean}/${object.name}`, created: Date.parse(object.created_at ?? '') }))
    .filter((object) => !referenced.has(object.path) && Number.isFinite(object.created) && object.created <= cutoff)
    .map((object) => object.path);

  await removeObjects(orphans);
  return orphans.length;
}
