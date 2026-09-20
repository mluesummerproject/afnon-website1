import 'server-only';

import { cleanReasons, type PublicComment, type ReasonKey } from '@/lib/ratings';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';

/**
 * Whether supabase/migrations/0002_table_orders_and_dish_comments.sql has been
 * run yet. Until it has, dishes show the star rating only — no comment box, no
 * comment list — so a guest is never offered something that cannot save.
 *
 * A positive answer is remembered for the life of the server process; a
 * negative one is rechecked at most every 30 seconds, so running the SQL takes
 * effect without a redeploy and without a query on every page view.
 */
let knownAvailable = false;
let checkedAt = 0;

export async function commentsAvailable(): Promise<boolean> {
  if (!isAdminSupabaseConfigured) return false;
  if (knownAvailable) return true;
  if (Date.now() - checkedAt < 30_000) return false;
  checkedAt = Date.now();
  const { error } = await getSupabaseAdmin().from('dish_comments').select('id').limit(1);
  knownAvailable = !error;
  return knownAvailable;
}

export const PUBLIC_COMMENTS_LIMIT = 30;

type PublicRow = {
  id: number;
  created_at: string;
  rating: number;
  comment: string | null;
  reasons: string[] | null;
  author_name: string | null;
};

/** Only the columns a guest may see. The phone, device and visitor key are never selected here. */
export const PUBLIC_COMMENT_COLUMNS = 'id, created_at, rating, comment, reasons, author_name';

export function toPublicComment(row: PublicRow): PublicComment {
  return {
    id: row.id,
    created_at: row.created_at,
    rating: row.rating,
    comment: row.comment?.trim() ? row.comment : null,
    reasons: cleanReasons(row.reasons, row.rating) as ReasonKey[],
    author_name: row.author_name?.trim() ? row.author_name : null,
  };
}

/** Visible comments for one dish, newest first. null means "could not be read" (distinct from "none yet"). */
export async function readPublicComments(dishId: number): Promise<PublicComment[] | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('dish_comments')
    .select(PUBLIC_COMMENT_COLUMNS)
    .eq('menu_item_id', dishId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PUBLIC_COMMENTS_LIMIT);
  if (error) {
    console.error('[comments] read failed with code', error.code);
    return null;
  }
  return (data as PublicRow[]).map(toPublicComment);
}
