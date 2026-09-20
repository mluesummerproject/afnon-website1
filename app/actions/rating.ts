'use server';

import { readFormToken, visitorKey, withinRateLimit } from '@/lib/antispam';
import { commentsAvailable, PUBLIC_COMMENT_COLUMNS, readPublicComments, toPublicComment } from '@/lib/comments-server';
import {
  cleanAuthorName,
  cleanAuthorPhone,
  cleanCommentText,
  cleanReasons,
  isDeviceId,
  ratingsByDish,
  toStars,
  type PublicComment,
} from '@/lib/ratings';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import type { DishRating } from '@/lib/types';

export type ReviewFailure = 'invalid' | 'phone' | 'gone' | 'rateLimited' | 'expired' | 'generic';

export type ReviewResult =
  | {
      status: 'ok';
      rating: DishRating;
      /** The comment as it now appears publicly, or null for a stars-only review. */
      comment: PublicComment | null;
      /** True when the stars were saved but the words could not be — the guest is told, not left guessing. */
      commentFailed: boolean;
    }
  | { status: 'error'; reason: ReviewFailure };

// Proportionate, not paranoid: a restaurant site with no accounts and no captcha. Guests on the
// restaurant's own Wi-Fi share one address, so the per-address ceilings are generous; the tight
// limits sit on the device, which a real guest has one of.
const MEMORY_WINDOW_MS = 10 * 60 * 1000;
const MEMORY_LIMIT = 60; // reviews per address per window
const DB_WINDOW_MS = 60 * 60 * 1000;
const NEW_DISH_LIMIT_PER_DEVICE = 30; // dishes newly rated per hour
const COMMENT_LIMIT_PER_DEVICE = 10; // comments per hour
const COMMENT_LIMIT_PER_VISITOR = 80; // comments per hour, whole address
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

const fail = (reason: ReviewFailure): ReviewResult => ({ status: 'error', reason });

export type ReviewInput = {
  dishId: unknown;
  rating: unknown;
  reasons?: unknown;
  text?: unknown;
  name?: unknown;
  phone?: unknown;
  deviceId: unknown;
  token?: unknown;
  /** Honeypot: a real guest never sees or fills it. */
  company?: unknown;
};

/**
 * One guest's review of one dish: a 1–5 star rating (required) plus, optionally,
 * one-tap reasons, free text, and a name and/or phone.
 *
 * The rating is written to dish_ratings — one row per device per dish, so
 * reviewing again updates the stars instead of stacking — and is the only
 * source of every average. Words go to dish_comments as a new row and appear
 * at once (no approval); staff can hide one afterwards.
 *
 * Everything is written with the service-role key, server-side: the public key
 * can neither write these tables nor see a device id or phone number, so nobody
 * can overwrite someone else's rating or read a private contact. The reasons
 * are checked against the fixed list for the given stars, the text is cleaned,
 * and errors come back as reason codes, never database text.
 */
export async function submitDishReview(input: ReviewInput): Promise<ReviewResult> {
  const raw = input && typeof input === 'object' ? input : ({} as ReviewInput);
  const dishId = Number(raw.dishId);
  const stars = toStars(raw.rating);
  const deviceId = raw.deviceId;
  if (!Number.isSafeInteger(dishId) || dishId <= 0 || stars === null || !isDeviceId(deviceId)) return fail('invalid');

  // Honeypot: a real guest never fills it. Refused, saved as nothing.
  if (typeof raw.company === 'string' && raw.company.trim() !== '') return fail('generic');

  const issued = readFormToken(raw.token);
  if (issued === null) return fail('generic');
  if (Date.now() - issued > MAX_TOKEN_AGE_MS) return fail('expired');

  const reasons = cleanReasons(raw.reasons, stars);
  const text = cleanCommentText(raw.text);
  const name = cleanAuthorName(raw.name);
  const phoneGiven = typeof raw.phone === 'string' && raw.phone.trim() !== '';
  const phone = cleanAuthorPhone(raw.phone);
  if (phoneGiven && phone === null) return fail('phone');

  if (!isAdminSupabaseConfigured) return fail('generic');

  const visitor = visitorKey();
  if (!withinRateLimit(`review:${visitor}`, MEMORY_LIMIT, MEMORY_WINDOW_MS)) return fail('rateLimited');

  const supabase = getSupabaseAdmin();

  const dish = await supabase.from('menu_items').select('id').eq('id', dishId).maybeSingle();
  if (dish.error) {
    console.error('[review] dish lookup failed with code', dish.error.code);
    return fail('generic');
  }
  if (!dish.data) return fail('gone');

  // Changing an existing rating is always allowed; only rating a NEW dish counts toward the hourly limit.
  const existing = await supabase.from('dish_ratings').select('id').eq('menu_item_id', dishId).eq('device_id', deviceId).maybeSingle();
  if (existing.error) {
    console.error('[review] rating lookup failed with code', existing.error.code);
    return fail('generic');
  }
  if (!existing.data) {
    const since = new Date(Date.now() - DB_WINDOW_MS).toISOString();
    const recent = await supabase.from('dish_ratings').select('id', { count: 'exact', head: true }).eq('device_id', deviceId).gte('updated_at', since);
    if (recent.error) {
      console.error('[review] throttle read failed with code', recent.error.code);
      return fail('generic');
    }
    if ((recent.count ?? 0) >= NEW_DISH_LIMIT_PER_DEVICE) return fail('rateLimited');
  }

  const wantsComment = (text !== '' || reasons.length > 0) && (await commentsAvailable());

  // Comment throttles are checked BEFORE the rating is written, so a refused review changes nothing.
  if (wantsComment) {
    const since = new Date(Date.now() - DB_WINDOW_MS).toISOString();
    const [byDevice, byVisitor] = await Promise.all([
      supabase.from('dish_comments').select('id', { count: 'exact', head: true }).eq('device_id', deviceId).gte('created_at', since),
      supabase.from('dish_comments').select('id', { count: 'exact', head: true }).eq('visitor_key', visitor).gte('created_at', since),
    ]);
    if (byDevice.error || byVisitor.error) {
      console.error('[review] comment throttle read failed with code', byDevice.error?.code ?? byVisitor.error?.code);
      return fail('generic');
    }
    if ((byDevice.count ?? 0) >= COMMENT_LIMIT_PER_DEVICE || (byVisitor.count ?? 0) >= COMMENT_LIMIT_PER_VISITOR) return fail('rateLimited');
  }

  const saved = await supabase
    .from('dish_ratings')
    .upsert(
      { menu_item_id: dishId, device_id: deviceId, rating: stars, visitor_key: visitor, updated_at: new Date().toISOString() },
      { onConflict: 'menu_item_id,device_id' },
    );
  if (saved.error) {
    console.error('[review] rating save failed with code', saved.error.code);
    return fail('generic');
  }

  let comment: PublicComment | null = null;
  let commentFailed = false;
  if (wantsComment) {
    // A double tap (or a retry after a slow network) must not post the same comment twice.
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const twin = await supabase
      .from('dish_comments')
      .select(PUBLIC_COMMENT_COLUMNS)
      .eq('menu_item_id', dishId)
      .eq('device_id', deviceId)
      .eq('rating', stars)
      .eq('is_hidden', false)
      .gte('created_at', since)
      .limit(20);
    const duplicate = twin.error
      ? undefined
      : (twin.data as Parameters<typeof toPublicComment>[0][]).find(
          (row) => (row.comment ?? '') === text && [...(row.reasons ?? [])].sort().join() === [...reasons].sort().join(),
        );

    if (duplicate) {
      comment = toPublicComment(duplicate);
    } else {
      const inserted = await supabase
        .from('dish_comments')
        .insert({
          menu_item_id: dishId,
          rating: stars,
          comment: text || null,
          reasons,
          author_name: name || null,
          author_phone: phone,
          device_id: deviceId,
          visitor_key: visitor,
        })
        .select(PUBLIC_COMMENT_COLUMNS)
        .single();
      if (inserted.error) {
        console.error('[review] comment save failed with code', inserted.error.code);
        commentFailed = true;
      } else {
        comment = toPublicComment(inserted.data);
      }
    }
  }

  const summary = await supabase.from('dish_rating_summary').select('menu_item_id, average_rating, rating_count').eq('menu_item_id', dishId);
  const rating = summary.error ? undefined : ratingsByDish(summary.data).get(dishId);
  if (!rating) {
    console.error('[review] summary read failed');
    return fail('generic');
  }
  return { status: 'ok', rating, comment, commentFailed };
}

/** The visible comments for one dish, loaded when a guest opens it. null = could not be read. */
export async function getDishComments(dishId: unknown): Promise<PublicComment[] | null> {
  const id = Number(dishId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (!(await commentsAvailable())) return null;
  if (!withinRateLimit(`comments-read:${visitorKey()}`, 240, 10 * 60 * 1000)) return null;
  return readPublicComments(id);
}
