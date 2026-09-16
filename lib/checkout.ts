/**
 * Checkout rules — pure, shared by the order sheet (inline errors as the
 * visitor types) and the placeOrder Server Action (the real check). Nothing
 * here trusts its input: the server runs every rule again.
 *
 * Payment is always cash, handled in person by staff. There is deliberately
 * no field, type or rule here for cards, fees, minimums or delivery times.
 */

import { MAX_LINES, MAX_QTY, type BasketLine } from '@/lib/basket';

export type Fulfillment = 'delivery' | 'pickup';
export type OrderField = 'phone' | 'name' | 'address' | 'addressNote';

export const ORDER_LIMITS = {
  name: 80,
  address: { min: 5, max: 500 },
  addressNote: 200,
  lines: MAX_LINES,
} as const;

/** Uzbekistan: +998 followed by 9 digits. */
export const UZ_PREFIX = '+998';

const controls = /[\x00-\x1f\x7f]/g;

/** Single-line text with control characters removed and whitespace collapsed. */
export function cleanLine(value: unknown): string {
  return typeof value === 'string' ? value.replace(controls, ' ').replace(/\s+/g, ' ').trim() : '';
}

/**
 * The 9 national digits of an Uzbek number, or null. Accepts what people type:
 * "90 123 45 67", "901234567", "+998 90 123-45-67", "998901234567".
 */
export function uzNationalDigits(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 40) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('998')) digits = digits.slice(3);
  return /^\d{9}$/.test(digits) ? digits : null;
}

/** "+998901234567" — the one stored form (the database refuses any other). */
export function normalizeUzPhone(raw: unknown): string | null {
  const national = uzNationalDigits(raw);
  return national ? `${UZ_PREFIX}${national}` : null;
}

/** "+998 90 123 45 67" — for display and the Telegram message. */
export function displayUzPhone(stored: string): string {
  const national = uzNationalDigits(stored);
  return national ? `${UZ_PREFIX} ${groupNational(national)}` : stored;
}

/**
 * Input mask: the +998 prefix is fixed, the rest groups as the visitor types.
 * A pasted full number ("+998 90…" or "998 90…") has its country code folded in.
 */
export function maskUzPhoneInput(value: string): string {
  const trimmed = value.trimStart();
  let digits = (trimmed.startsWith(UZ_PREFIX) ? trimmed.slice(UZ_PREFIX.length) : trimmed).replace(/\D/g, '');
  if (digits.length > 9 && digits.startsWith('998')) digits = digits.slice(3);
  return `${UZ_PREFIX} ${groupNational(digits.slice(0, 9))}`;
}

/** "901234567" → "90 123 45 67", growing as digits arrive. */
function groupNational(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(' ');
}

export type OrderDetails = {
  fulfillment: Fulfillment;
  phone: string;
  name: string;
  address: string;
  addressNote: string;
  geo: { lat: number; lng: number } | null;
};

export type ValidatedDetails = {
  fulfillment: Fulfillment;
  phone: string;
  name: string | null;
  address: string | null;
  addressNote: string | null;
  geo: { lat: number; lng: number } | null;
};

/** Coordinates only when they are real numbers in range; anything else is dropped, never fatal. */
export function cleanGeo(raw: unknown): { lat: number; lng: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const { lat, lng } = raw as Record<string, unknown>;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

export function validateDetails(raw: Partial<Record<keyof OrderDetails, unknown>>): { values: ValidatedDetails | null; invalid: OrderField[] } {
  const fulfillment: Fulfillment = raw.fulfillment === 'delivery' ? 'delivery' : 'pickup';
  const invalid: OrderField[] = [];

  const phone = normalizeUzPhone(raw.phone);
  if (!phone) invalid.push('phone');

  const name = cleanLine(raw.name);
  if (name.length > ORDER_LIMITS.name) invalid.push('name');

  const address = cleanLine(raw.address);
  const addressNote = cleanLine(raw.addressNote);
  if (fulfillment === 'delivery') {
    if (address.length < ORDER_LIMITS.address.min || address.length > ORDER_LIMITS.address.max) invalid.push('address');
    if (addressNote.length > ORDER_LIMITS.addressNote) invalid.push('addressNote');
  }

  if (invalid.length > 0 || !phone) return { values: null, invalid };
  const delivery = fulfillment === 'delivery';
  return {
    values: {
      fulfillment,
      phone,
      name: name || null,
      address: delivery ? address : null,
      addressNote: delivery && addressNote ? addressNote : null,
      geo: delivery ? cleanGeo(raw.geo) : null,
    },
    invalid: [],
  };
}

/** Basket lines as sent by a browser: well-formed, de-duplicated, bounded — or null. */
export function cleanOrderLines(raw: unknown): BasketLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > ORDER_LIMITS.lines) return null;
  const byId = new Map<number, number>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const { id, qty } = entry as Record<string, unknown>;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    byId.set(id, Math.min(MAX_QTY, (byId.get(id) ?? 0) + qty));
  }
  return Array.from(byId, ([id, qty]) => ({ id, qty }));
}

/** One line of the stored snapshot — prices as they were at the moment of ordering. */
export type OrderItemSnapshot = { id: number; name: string; unit_price: number; qty: number };

export function snapshotTotal(items: OrderItemSnapshot[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.unit_price * item.qty, 0) * 100) / 100;
}

export function mapsLink(geo: { lat: number; lng: number }): string {
  return `https://maps.google.com/?q=${geo.lat},${geo.lng}`;
}
