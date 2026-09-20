/**
 * Dish ratings and comments — pure helpers shared by the menu query, the admin
 * panel and the Server Actions.
 *
 * Averages are never computed in the browser and raw ratings never leave the
 * database: the `dish_rating_summary` view does the maths and both readers
 * (public site, admin) only ever see its two numbers.
 */

import type { DishRating } from '@/lib/types';

/** A UUID as crypto.randomUUID() writes it. The device id is random, never personal. */
export function isDeviceId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** 1–5 as a whole number, or null. */
export function toStars(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

type SummaryRow = { menu_item_id: unknown; average_rating: unknown; rating_count: unknown };

/** One entry per dish that has at least one rating; anything malformed is dropped rather than shown. */
export function ratingsByDish(rows: SummaryRow[] | null | undefined): Map<number, DishRating> {
  const map = new Map<number, DishRating>();
  for (const row of rows ?? []) {
    // Number(null) is 0 and Number('') is 0: a missing value must never become a fake rating.
    if (row.menu_item_id === null || row.average_rating === null || row.rating_count === null) continue;
    if (row.average_rating === '' || row.rating_count === '') continue;
    const id = Number(row.menu_item_id);
    const average = Number(row.average_rating);
    const count = Number(row.rating_count);
    if (!Number.isSafeInteger(id) || !Number.isFinite(average) || average < 1 || average > 5 || !Number.isInteger(count) || count < 1) continue;
    map.set(id, { average: Math.round(average * 10) / 10, count });
  }
  return map;
}

/** "4.3" — one decimal, always with a point, whatever the locale. */
export function formatAverage(average: number): string {
  return average.toFixed(1);
}

/** Highest average first, then most ratings; unrated dishes last. */
export function compareByRating(a: DishRating | null | undefined, b: DishRating | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return b.average - a.average || b.count - a.count;
}

/* ---------------------------------------------------------------- comments */

/**
 * The one-tap reasons. Stored as these keys (never as translated text), so a
 * comment left in Uzbek reads correctly to a guest browsing in Russian. Low
 * ratings offer what went wrong, high ratings what went right; three stars
 * offers neither.
 */
export const LOW_REASONS = ['too_salty', 'cold', 'wrong_order', 'slow_service'] as const;
export const HIGH_REASONS = ['great_taste', 'good_value', 'nicely_presented'] as const;
export type ReasonKey = (typeof LOW_REASONS)[number] | (typeof HIGH_REASONS)[number];

/** The reasons offered for a star rating: 1–2 low, 4–5 high, 3 (or none yet) neither. */
export function reasonsFor(stars: number): readonly ReasonKey[] {
  if (stars >= 1 && stars <= 2) return LOW_REASONS;
  if (stars >= 4 && stars <= 5) return HIGH_REASONS;
  return [];
}

/** Only reasons that belong to this rating, each once, in a fixed order — anything else is dropped. */
export function cleanReasons(raw: unknown, stars: number): ReasonKey[] {
  if (!Array.isArray(raw)) return [];
  const allowed = reasonsFor(stars);
  return allowed.filter((key) => raw.includes(key));
}

export const COMMENT_LIMITS = { text: 600, name: 60 } as const;

const CONTROLS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/** Free text: control characters out, line breaks kept (but never more than one blank line), trimmed. */
export function cleanCommentText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROLS, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, COMMENT_LIMITS.text);
}

/** A display name: one line, no control characters. Empty means anonymous. */
export function cleanAuthorName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, COMMENT_LIMITS.name);
}

/** A phone number, loosely: 7–15 digits with the usual punctuation. Returns null when it is not one (or empty). */
export function cleanAuthorPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed.replace(/\s+/g, ' ').slice(0, 32);
}

/** What a guest may read: no phone, no device, no visitor key — ever. */
export type PublicComment = {
  id: number;
  created_at: string;
  rating: number;
  comment: string | null;
  reasons: ReasonKey[];
  author_name: string | null;
};
