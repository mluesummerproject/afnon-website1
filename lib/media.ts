/**
 * Media rules shared by the browser (early feedback) and the server (the
 * actual gate). Nothing here trusts a filename, an extension or a MIME type
 * the browser reports: the server re-reads the first bytes of every stored
 * object and decides from those.
 */

export const MEDIA_BUCKET = 'media';

export const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;

export const VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
} as const;

export type ImageMime = keyof typeof IMAGE_TYPES;
export type VideoMime = keyof typeof VIDEO_TYPES;

/** After in-browser resizing a phone photo is typically 300–900 KB. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Matches the bucket's own limit; keep promo films short and compressed. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
/** Longest edge after in-browser resizing. Plenty for a full-screen phone view. */
export const IMAGE_MAX_EDGE = 2000;

export const MAX_ACTIVE_VIDEOS = 5;

export function isImageMime(value: string): value is ImageMime {
  return Object.prototype.hasOwnProperty.call(IMAGE_TYPES, value);
}

export function isVideoMime(value: string): value is VideoMime {
  return Object.prototype.hasOwnProperty.call(VIDEO_TYPES, value);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...Array.from(bytes.subarray(start, start + length)));
}

/**
 * Identifies a file from its signature. Returns null for anything that is not
 * one of the formats the site can actually display.
 */
export function sniffMime(bytes: Uint8Array): ImageMime | VideoMime | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image/webp';
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video/webm';

  // ISO base media (MP4, MOV, AVIF, HEIC …) — decided by the major brand.
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand === 'qt  ') return 'video/quicktime';
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return null;
    return 'video/mp4';
  }

  return null;
}

/** Storage layout: one folder per dish, one folder for films. */
export function menuImagePrefix(menuItemId: number): string {
  return `menu/${menuItemId}/`;
}

export const VIDEO_PREFIX = 'videos/';

export function publicObjectUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

/**
 * Recovers the object path from one of this project's public media URLs.
 * Returns null for anything else — external links are never touched in storage.
 */
export function storagePathFromUrl(url: string, supabaseUrl: string): string | null {
  const prefix = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split('?')[0]);
  if (!path || path.includes('..') || path.startsWith('/')) return null;
  return path;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
