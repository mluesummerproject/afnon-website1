import 'server-only';

import { requireAdmin } from '@/lib/admin';
import { ratingsByDish } from '@/lib/ratings';
import { labelsByCategory, orderCategoryGroups } from '@/lib/categories';
import { groupByCategory, sortForAdmin } from '@/lib/ordering';
import { rowsToStored, type StoredSettings } from '@/lib/settings-core';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import {
  MENU_ITEM_COLUMNS,
  ORDER_STATUSES,
  type Banner,
  type CategoryLabelRow,
  type Feedback,
  type Message,
  type MenuImage,
  type MenuItem,
  type Order,
  type OrderStatus,
  type PromoVideo,
  type RestaurantTable,
} from '@/lib/types';

export type { AdminDish } from '@/lib/admin-types';
import type { AdminDish } from '@/lib/admin-types';
import { getAdminDict } from '@/lib/admin-locale';
import { format } from '@/lib/i18n';

const t = () => getAdminDict();

/**
 * Every reader below starts with requireAdmin(). The dashboard layout also
 * checks the session, but in the App Router a layout and its page render in
 * parallel: a layout's redirect does not stop the page from running its own
 * queries and streaming the result. The check therefore lives here, next to
 * the data, so no staff-only row can ever be read for a signed-out request.
 */

/** Every dish with its photos, in exactly the order guests see. */
export async function getAdminMenu(): Promise<{ dishes: AdminDish[]; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { dishes: [], error: t().toast.missingKey };

  try {
    const supabase = getSupabaseAdmin();
    const [items, images, labels, ratingRows] = await Promise.all([
      supabase.from('menu_items').select(MENU_ITEM_COLUMNS),
      supabase
        .from('menu_item_images')
        .select('id, menu_item_id, image_url, sort_order, caption')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true }),
      supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
      supabase.from('dish_rating_summary').select('menu_item_id, average_rating, rating_count'),
    ]);

    if (items.error) return { dishes: [], error: format(t().toast.loadMenu, { reason: items.error.message }) };

    const byDish = new Map<number, MenuImage[]>();
    for (const image of (images.data ?? []) as MenuImage[]) {
      if (image.menu_item_id === null) continue;
      byDish.set(image.menu_item_id, [...(byDish.get(image.menu_item_id) ?? []), image]);
    }

    // Same order as the public site: category_labels order, then the kitchen's dish order.
    const labelMap = labelsByCategory((labels.data ?? []) as CategoryLabelRow[]);
    const ordered = orderCategoryGroups(groupByCategory(sortForAdmin((items.data ?? []) as MenuItem[])), labelMap).flatMap((group) => group.items);
    const ratings = ratingsByDish(ratingRows.error ? [] : ratingRows.data);
    const dishes = ordered.map((item) => ({
      ...item,
      images: byDish.get(item.id) ?? [],
      rating: ratings.get(item.id) ?? null,
    }));

    return { dishes, error: images.error ? format(t().toast.loadPhotos, { reason: images.error.message }) : undefined };
  } catch {
    return { dishes: [], error: t().toast.noAdminConnection };
  }
}

export async function getAdminVideos(): Promise<{ videos: PromoVideo[]; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { videos: [], error: t().toast.missingKey };

  const { data, error } = await getSupabaseAdmin()
    .from('promo_videos')
    .select('id, title, video_url, sort_order, is_active')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) return { videos: [], error: format(t().toast.loadFilms, { reason: error.message }) };
  return { videos: (data ?? []) as PromoVideo[] };
}

export const MESSAGES_PAGE_SIZE = 25;

export async function getMessages(
  filter: 'all' | 'unread',
  page: number,
): Promise<{ messages: Message[]; total: number; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { messages: [], total: 0, error: t().toast.missingKey };

  const from = (Math.max(1, page) - 1) * MESSAGES_PAGE_SIZE;
  let query = getSupabaseAdmin()
    .from('messages')
    .select('id, name, contact, message, is_read, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + MESSAGES_PAGE_SIZE - 1);

  if (filter === 'unread') query = query.or('is_read.is.null,is_read.eq.false');

  const { data, error, count } = await query;
  if (error) return { messages: [], total: 0, error: format(t().toast.loadMessages, { reason: error.message }) };
  return { messages: (data ?? []) as Message[], total: count ?? 0 };
}

export async function getUnreadCount(): Promise<number> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return 0;
  const { count } = await getSupabaseAdmin()
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or('is_read.is.null,is_read.eq.false');
  return count ?? 0;
}

export const ORDERS_PAGE_SIZE = 25;

const ORDER_COLUMNS =
  'id, created_at, order_code, fulfillment_type, customer_name, phone, address, address_note, geo_lat, geo_lng, items, total, payment_method, status, language, telegram_opened';

/** Orders newest first, optionally one status only. Read only here, with the service role. */
export async function getOrders(filter: OrderStatus | 'all', page: number): Promise<{ orders: Order[]; total: number; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { orders: [], total: 0, error: t().toast.missingKey };

  const from = (Math.max(1, page) - 1) * ORDERS_PAGE_SIZE;
  let query = getSupabaseAdmin()
    .from('orders')
    .select(ORDER_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + ORDERS_PAGE_SIZE - 1);
  if (filter !== 'all') query = query.eq('status', filter);

  const { data, error, count } = await query;
  if (error) return { orders: [], total: 0, error: format(t().toast.loadOrders, { reason: error.message }) };
  return { orders: (data ?? []) as Order[], total: count ?? 0 };
}

/** How many orders sit in each status — real counts, zero included. */
export async function getOrderCounts(): Promise<Record<OrderStatus, number>> {
  requireAdmin();
  const zero = { new: 0, confirmed: 0, completed: 0, cancelled: 0 };
  if (!isAdminSupabaseConfigured) return zero;
  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    ORDER_STATUSES.map((status) => supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', status)),
  );
  return Object.fromEntries(ORDER_STATUSES.map((status, index) => [status, results[index].count ?? 0])) as Record<OrderStatus, number>;
}

/** Orders nobody has handled yet — the Orders tab badge. */
export async function getNewOrderCount(): Promise<number> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return 0;
  const { count } = await getSupabaseAdmin().from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return count ?? 0;
}

export type CategoryOverview = { category: string; label: CategoryLabelRow | null; dishCount: number };

/** Every category that has dishes or a label row, in public display order. */
export async function getCategoryOverview(): Promise<{ categories: CategoryOverview[]; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { categories: [], error: t().toast.missingKey };
  const supabase = getSupabaseAdmin();
  const [items, labels] = await Promise.all([
    supabase.from('menu_items').select('id, category, sort_order'),
    supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
  ]);
  if (items.error || labels.error) return { categories: [], error: format(t().toast.loadCategories, { reason: (items.error ?? labels.error)?.message ?? '—' }) };

  const labelMap = labelsByCategory((labels.data ?? []) as CategoryLabelRow[]);
  const groups = orderCategoryGroups(groupByCategory(sortForAdmin((items.data ?? []) as { id: number; category: string | null; sort_order: number | null }[])), labelMap);
  const withDishes = new Set(groups.map((group) => group.name));
  const overview: CategoryOverview[] = groups.map((group) => ({ category: group.name, label: labelMap.get(group.name) ?? null, dishCount: group.items.length }));

  const orphanLabels = ((labels.data ?? []) as CategoryLabelRow[])
    .filter((row) => !withDishes.has(row.category.trim()))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => ({ category: row.category, label: row, dishCount: 0 }));

  return { categories: [...overview, ...orphanLabels] };
}

/**
 * Whether supabase/migrations/0001_banner_links.sql has been run yet. The
 * per-banner link controls are hidden until it has, so staff are never shown
 * a control that cannot save.
 */
export async function bannerLinksAvailable(): Promise<boolean> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return false;
  const { error } = await getSupabaseAdmin().from('banners').select('link_type').limit(1);
  return !error;
}

export async function getAdminBanners(): Promise<{ banners: Banner[]; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { banners: [], error: t().toast.missingKey };
  const { data, error } = await getSupabaseAdmin()
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error) return { banners: [], error: format(t().toast.loadBanners, { reason: error.message }) };
  return { banners: (data ?? []) as Banner[] };
}

export async function getStoredSettings(): Promise<{ settings: StoredSettings; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { settings: {}, error: t().toast.missingKey };
  const { data, error } = await getSupabaseAdmin().from('site_settings').select('key, value');
  if (error) return { settings: {}, error: format(t().toast.loadSettings, { reason: error.message }) };
  return { settings: rowsToStored(data ?? []) };
}


/* ==========================================================================
   Tables (Stollar) — printed QR codes.
   ========================================================================== */

/** Every table, newest first isn't useful here — table number order is. */
export async function getTables(): Promise<{ tables: RestaurantTable[]; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { tables: [], error: t().toast.missingKey };
  const { data, error } = await getSupabaseAdmin().from('restaurant_tables').select('*').order('table_number', { ascending: true });
  if (error) return { tables: [], error: format(t().toast.loadTables, { reason: error.message }) };
  return { tables: (data ?? []) as RestaurantTable[] };
}

/* ==========================================================================
   Feedback (table reviews) — a second Inbox source, never a second inbox.
   ========================================================================== */

export const FEEDBACK_PAGE_SIZE = 25;

export type FeedbackWithTable = Feedback & { table_number: string | null };

const FEEDBACK_COLUMNS = 'id, created_at, table_id, overall_rating, comment, is_anonymous, name, phone, language, status, restaurant_tables(table_number)';

function withTableNumber(row: Feedback & { restaurant_tables: { table_number: string } | { table_number: string }[] | null }): FeedbackWithTable {
  const joined = row.restaurant_tables;
  const table_number = Array.isArray(joined) ? joined[0]?.table_number ?? null : joined?.table_number ?? null;
  const { restaurant_tables: _drop, ...rest } = row;
  return { ...rest, table_number };
}

export async function getFeedback(filter: 'all' | 'unread', page: number): Promise<{ feedback: FeedbackWithTable[]; total: number; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { feedback: [], total: 0, error: t().toast.missingKey };

  const from = (Math.max(1, page) - 1) * FEEDBACK_PAGE_SIZE;
  let query = getSupabaseAdmin()
    .from('feedback')
    .select(FEEDBACK_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + FEEDBACK_PAGE_SIZE - 1);
  if (filter === 'unread') query = query.eq('status', 'new');

  const { data, error, count } = await query;
  if (error) return { feedback: [], total: 0, error: format(t().toast.loadFeedback, { reason: error.message }) };
  return { feedback: (data ?? []).map((row) => withTableNumber(row as never)), total: count ?? 0 };
}

export async function getUnreadFeedbackCount(): Promise<number> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return 0;
  const { count } = await getSupabaseAdmin().from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return count ?? 0;
}

/** One row of the unified Inbox: a contact message or a piece of table feedback, sharing a timeline. */
export type InboxEntry = ({ kind: 'message' } & Message) | ({ kind: 'feedback' } & FeedbackWithTable);

/**
 * Messages and feedback merged into one timeline, newest first. There is no
 * SQL UNION across two differently-shaped tables here — instead each source
 * is over-fetched just far enough to cover every page up to and including the
 * one requested, then merged and sliced. Fine at a single restaurant's volume;
 * `total` is still the real combined count, not the over-fetched one.
 */
export async function getUnifiedInbox(page: number): Promise<{ entries: InboxEntry[]; total: number; error?: string }> {
  requireAdmin();
  if (!isAdminSupabaseConfigured) return { entries: [], total: 0, error: t().toast.missingKey };

  const need = Math.max(1, page) * MESSAGES_PAGE_SIZE;
  const supabase = getSupabaseAdmin();
  const [messages, feedback] = await Promise.all([
    supabase
      .from('messages')
      .select('id, name, contact, message, is_read, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, need - 1),
    supabase
      .from('feedback')
      .select(FEEDBACK_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, need - 1),
  ]);

  if (messages.error || feedback.error) {
    const reason = (messages.error ?? feedback.error)!.message;
    return { entries: [], total: 0, error: format(t().toast.loadMessages, { reason }) };
  }

  const messageEntries: InboxEntry[] = (messages.data ?? []).map((row) => ({ kind: 'message', ...(row as Message) }));
  const feedbackEntries: InboxEntry[] = (feedback.data ?? []).map((row) => ({ kind: 'feedback', ...withTableNumber(row as never) }));
  const merged = [...messageEntries, ...feedbackEntries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const from = (Math.max(1, page) - 1) * MESSAGES_PAGE_SIZE;
  const total = (messages.count ?? 0) + (feedback.count ?? 0);
  return { entries: merged.slice(from, from + MESSAGES_PAGE_SIZE), total };
}
