/** Favourites — a device-only convenience. Pure parsing, so it can be tested. */
export const FAVORITES_STORAGE_KEY = 'afnon_favorites_v1';

export function parseFavorites(raw: string | null | undefined): Set<number> {
  if (!raw) return new Set();
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return new Set();
    return new Set(data.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0).slice(0, 500));
  } catch {
    return new Set();
  }
}
