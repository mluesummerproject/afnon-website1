/** Pure menu formatting — no data fetching, safe to import anywhere (and to unit-test). */

const THIN_SPACE = String.fromCharCode(0x2009);

/** Stable, URL-safe anchor for a category heading, in any script. */
export function categorySlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'category';
}

/**
 * The numeric value of a text price, or null when the kitchen wrote something
 * that is not a plain number ("Market price", "45 000 so‘m / 100 g").
 */
export function parseAmount(price: string | null | undefined): number | null {
  const raw = price?.trim();
  if (!raw) return null;
  const numeric = raw.replace(/\s/g, ''); // JS \s also matches no-break and thin spaces
  if (!/^\d+([.,]\d{1,2})?$/.test(numeric)) return null;
  const value = Number(numeric.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** 130000 → "130 000 so‘m". `separator` is a thin space on screen, a normal space in messages. */
export function formatAmount(value: number, currency: string, separator: string = THIN_SPACE): string {
  const [whole, fraction] = (Math.round(value * 100) / 100).toString().split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const body = fraction ? `${grouped}.${fraction.padEnd(2, '0')}` : grouped;
  return currency ? `${body}${separator}${currency}` : body;
}

/**
 * Prices are stored as text. Plain numbers get grouping and the visitor's
 * currency word; anything the kitchen formatted deliberately is left alone.
 */
export function formatPrice(price: string | null | undefined, currency: string): string | null {
  const raw = price?.trim();
  if (!raw) return null;
  const value = parseAmount(raw);
  return value === null ? raw : formatAmount(value, currency);
}

/** Only URLs the site can safely render: https, or a local /public path. */
export function isRenderableImage(src: string | null | undefined): src is string {
  return typeof src === 'string' && /^(https:\/\/|\/(?!\/))/.test(src.trim());
}

/** Hosts next/image is configured to optimise. Anything else is served as-is. */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const { hostname } = new URL(src);
    return hostname === 'images.unsplash.com' || hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}
