import type { DishRating, MenuImage, MenuItem } from '@/lib/types';

/**
 * What every admin mutation returns: enough to show SAVING → SUCCESS / FAILURE
 * in place. Safe for client imports.
 *
 * `moved` says a reorder actually changed something, so the caller can offer
 * Undo. It is a flag rather than a reading of `message`, because the message
 * is translated and English substrings would not survive the trip.
 */
export type ActionResult = { ok: boolean; message: string; id?: number; at?: number; moved?: boolean } | null;

/** A dish with its ordered photos, as the admin works with it. */
export type AdminDish = MenuItem & { images: MenuImage[]; rating: DishRating | null };
