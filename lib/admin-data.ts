import 'server-only';

import { labelsByCategory, orderCategoryGroups } from '@/lib/categories';
import { groupByCategory, sortForAdmin } from '@/lib/ordering';
import { rowsToStored, type StoredSettings } from '@/lib/settings-core';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import { MENU_ITEM_COLUMNS, type Banner, type CategoryLabelRow, type Message, type MenuImage, type MenuItem, type PromoVideo } from '@/lib/types';

export type { AdminDish } from '@/lib/admin-types';
import type { AdminDish } from '@/lib/admin-types';

const MISSING_KEY = 'SUPABASE_SERVICE_ROLE_KEY is not set on the server, so this cannot be read or edited here.';

/** Every dish with its photos, in exactly the order guests see. */
export async function getAdminMenu(): Promise<{ dishes: AdminDish[]; error?: string }> {
  if (!isAdminSupabaseConfigured) return { dishes: [], error: MISSING_KEY };

  try {
    const supabase = getSupabaseAdmin();
    const [items, images, labels] = await Promise.all([
      supabase.from('menu_items').select(MENU_ITEM_COLUMNS),
      supabase
        .from('menu_item_images')
        .select('id, menu_item_id, image_url, sort_order, caption')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true }),
      supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
    ]);

    if (items.error) return { dishes: [], error: `Could not load the menu: ${items.error.message}` };

    const byDish = new Map<number, MenuImage[]>();
    for (const image of (images.data ?? []) as MenuImage[]) {
      if (image.menu_item_id === null) continue;
      byDish.set(image.menu_item_id, [...(byDish.get(image.menu_item_id) ?? []), image]);
    }

    // Same order as the public site: category_labels order, then the kitchen's dish order.
    const labelMap = labelsByCategory((labels.data ?? []) as CategoryLabelRow[]);
    const ordered = orderCategoryGroups(groupByCategory(sortForAdmin((items.data ?? []) as MenuItem[])), labelMap).flatMap((group) => group.items);
    const dishes = ordered.map((item) => ({
      ...item,
      images: byDish.get(item.id) ?? [],
    }));

    return { dishes, error: images.error ? `Photos could not be loaded: ${images.error.message}` : undefined };
  } catch {
    return { dishes: [], error: 'Could not reach Supabase with the admin credentials.' };
  }
}

export async function getAdminVideos(): Promise<{ videos: PromoVideo[]; error?: string }> {
  if (!isAdminSupabaseConfigured) return { videos: [], error: MISSING_KEY };

  const { data, error } = await getSupabaseAdmin()
    .from('promo_videos')
    .select('id, title, video_url, sort_order, is_active')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) return { videos: [], error: `Could not load films: ${error.message}` };
  return { videos: (data ?? []) as PromoVideo[] };
}

export const MESSAGES_PAGE_SIZE = 25;

export async function getMessages(
  filter: 'all' | 'unread',
  page: number,
): Promise<{ messages: Message[]; total: number; error?: string }> {
  if (!isAdminSupabaseConfigured) return { messages: [], total: 0, error: MISSING_KEY };

  const from = (Math.max(1, page) - 1) * MESSAGES_PAGE_SIZE;
  let query = getSupabaseAdmin()
    .from('messages')
    .select('id, name, contact, message, is_read, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + MESSAGES_PAGE_SIZE - 1);

  if (filter === 'unread') query = query.or('is_read.is.null,is_read.eq.false');

  const { data, error, count } = await query;
  if (error) return { messages: [], total: 0, error: `Could not load messages: ${error.message}` };
  return { messages: (data ?? []) as Message[], total: count ?? 0 };
}

export async function getUnreadCount(): Promise<number> {
  if (!isAdminSupabaseConfigured) return 0;
  const { count } = await getSupabaseAdmin()
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or('is_read.is.null,is_read.eq.false');
  return count ?? 0;
}

export type CategoryOverview = { category: string; label: CategoryLabelRow | null; dishCount: number };

/** Every category that has dishes or a label row, in public display order. */
export async function getCategoryOverview(): Promise<{ categories: CategoryOverview[]; error?: string }> {
  if (!isAdminSupabaseConfigured) return { categories: [], error: MISSING_KEY };
  const supabase = getSupabaseAdmin();
  const [items, labels] = await Promise.all([
    supabase.from('menu_items').select('id, category, sort_order'),
    supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
  ]);
  if (items.error || labels.error) return { categories: [], error: `Could not load categories: ${(items.error ?? labels.error)?.message}` };

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

export async function getAdminBanners(): Promise<{ banners: Banner[]; error?: string }> {
  if (!isAdminSupabaseConfigured) return { banners: [], error: MISSING_KEY };
  const { data, error } = await getSupabaseAdmin()
    .from('banners')
    .select('id, image_url, title, sort_order, is_active')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error) return { banners: [], error: `Could not load banners: ${error.message}` };
  return { banners: (data ?? []) as Banner[] };
}

export async function getStoredSettings(): Promise<{ settings: StoredSettings; error?: string }> {
  if (!isAdminSupabaseConfigured) return { settings: {}, error: MISSING_KEY };
  const { data, error } = await getSupabaseAdmin().from('site_settings').select('key, value');
  if (error) return { settings: {}, error: `Could not load settings: ${error.message}` };
  return { settings: rowsToStored(data ?? []) };
}

