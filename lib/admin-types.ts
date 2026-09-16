import type { MenuImage, MenuItem } from '@/lib/types';

/** What every admin mutation returns: enough to show SAVING → SUCCESS / FAILURE in place. Safe for client imports. */
export type ActionResult = { ok: boolean; message: string; id?: number; at?: number } | null;

/** A dish with its ordered photos, as the admin works with it. */
export type AdminDish = MenuItem & { images: MenuImage[] };
