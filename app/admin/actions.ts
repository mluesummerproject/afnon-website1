'use server';

import { redirect } from 'next/navigation';

import { fail, readText, refreshSite, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { createSession, destroySession, verifyPassword } from '@/lib/auth';
import { menuImagePrefix, storagePathFromUrl } from '@/lib/media';
import { labelsByCategory, orderCategoryGroups } from '@/lib/categories';
import { endOfCategory, groupByCategory, moveItem as planItemMove, renumber, sortForAdmin, type OrderWrite } from '@/lib/ordering';
import type { CategoryLabelRow } from '@/lib/types';
import { removeObjects, sweepOrphans } from '@/lib/storage';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type FormState = { error?: string } | null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * A category typed for the first time gets a category_labels row, seeded with
 * that text in all three languages and placed last, so it shows up in the
 * Categories tab ready to translate. Existing rows are never touched.
 */
async function ensureCategoryLabel(category: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from('category_labels').select('category').eq('category', category).maybeSingle();
  if (existing) return;
  const { data: last } = await supabase
    .from('category_labels')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  await supabase
    .from('category_labels')
    .upsert(
      { category, name_uz: category, name_ru: category, name_en: category, sort_order: ((last?.sort_order as number | null) ?? 0) + 10 },
      { onConflict: 'category', ignoreDuplicates: true },
    );
}

// ---------------------------------------------------------------- auth

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'ADMIN_PASSWORD is not set on the server. Add it and restart the app.' };
  }

  const password = readText(formData, 'password');
  if (!password) return { error: 'Enter the password.' };

  // Small, constant delay blunts brute forcing without hurting a real login.
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!verifyPassword(password)) return { error: 'That password is not correct.' };

  createSession();
  redirect('/admin');
}

export async function logout(): Promise<void> {
  destroySession();
  redirect('/admin/login?m=signed-out');
}

// ---------------------------------------------------------------- helpers

type OrderRow = { id: number; category: string | null; sort_order: number | null };

async function loadOrderRows(): Promise<OrderRow[]> {
  const { data, error } = await getSupabaseAdmin().from('menu_items').select('id, category, sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

async function applyOrder(writes: OrderWrite[]): Promise<void> {
  const results = await Promise.all(
    writes.map((write) =>
      getSupabaseAdmin().from('menu_items').update({ sort_order: write.sort_order }).eq('id', write.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

async function normalizeOrder(): Promise<void> {
  await applyOrder(renumber(sortForAdmin(await loadOrderRows())));
}

const LIMITS = { name: 120, description: 600, category: 80, price: 40, imageUrl: 500 };

function parseDish(formData: FormData) {
  const values = {
    category: readText(formData, 'category'),
    price: readText(formData, 'price'),
    image_url: readText(formData, 'image_url'),
    name_uz: readText(formData, 'name_uz'),
    name_ru: readText(formData, 'name_ru'),
    name_en: readText(formData, 'name_en'),
    description_uz: readText(formData, 'description_uz'),
    description_ru: readText(formData, 'description_ru'),
    description_en: readText(formData, 'description_en'),
    is_available: formData.get('is_available') === 'on',
    old_price: readText(formData, 'old_price'),
    badge: readText(formData, 'badge').replace(/\s+/g, ' '),
  };

  if (!values.name_uz && !values.name_ru && !values.name_en) {
    return { error: 'Give the dish a name — at least in Uzbek.' } as const;
  }
  if (!values.category) return { error: 'Choose or type a category.' } as const;
  if ([values.name_uz, values.name_ru, values.name_en].some((name) => name.length > LIMITS.name)) {
    return { error: `Dish names can be at most ${LIMITS.name} characters.` } as const;
  }
  if ([values.description_uz, values.description_ru, values.description_en].some((d) => d.length > LIMITS.description)) {
    return { error: `Descriptions can be at most ${LIMITS.description} characters.` } as const;
  }
  if (values.category.length > LIMITS.category) return { error: 'That category name is too long.' } as const;
  if (values.price.length > LIMITS.price) return { error: 'That price is too long.' } as const;
  if (values.image_url && (!/^(https:\/\/|\/(?!\/))/.test(values.image_url) || values.image_url.length > LIMITS.imageUrl)) {
    return { error: 'The image link must start with https:// or /.' } as const;
  }

  let oldPrice: number | null = null;
  if (values.old_price) {
    const normalized = values.old_price.replace(/\s/g, '').replace(',', '.');
    if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) {
      return { error: 'The old price must be a plain number, like 65000.' } as const;
    }
    oldPrice = Number(normalized);
  }
  if (values.badge.length > 16) return { error: 'Keep the badge short — 16 characters at most (e.g. “Yangi”, “Hit”).' } as const;

  const nullIfEmpty = (value: string) => (value ? value : null);

  return {
    row: {
      category: values.category,
      price: nullIfEmpty(values.price),
      image_url: nullIfEmpty(values.image_url),
      is_available: values.is_available,
      name_uz: nullIfEmpty(values.name_uz),
      name_ru: nullIfEmpty(values.name_ru),
      name_en: nullIfEmpty(values.name_en),
      description_uz: nullIfEmpty(values.description_uz),
      description_ru: nullIfEmpty(values.description_ru),
      description_en: nullIfEmpty(values.description_en),
      // The original columns stay populated (and required), in the default language first.
      name: values.name_uz || values.name_ru || values.name_en,
      description: nullIfEmpty(values.description_uz || values.description_ru || values.description_en),
      old_price: oldPrice,
      badge: nullIfEmpty(values.badge),
    },
  } as const;
}

// ---------------------------------------------------------------- menu CRUD

export async function saveItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const parsed = parseDish(formData);
  if ('error' in parsed) return fail(parsed.error ?? 'Please check the form.');

  const rawId = readText(formData, 'id');
  const id = rawId ? toId(rawId) : null;
  if (rawId && id === null) return fail('That dish could not be identified.');

  try {
    const supabase = getSupabaseAdmin();
    const rows = await loadOrderRows();

    if (id === null) {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({ ...parsed.row, sort_order: endOfCategory(rows, parsed.row.category) })
        .select('id')
        .single();
      if (error || !data) return fail(`Could not add the dish: ${error?.message ?? 'unknown error'}`);

      await normalizeOrder();
      await ensureCategoryLabel(parsed.row.category);
      refreshSite();
      return succeed(`“${parsed.row.name}” added. Open it below to add photos.`, data.id as number);
    }

    const current = rows.find((row) => row.id === id);
    if (!current) return fail('That dish no longer exists — it may have been deleted.');

    const categoryChanged = (current.category ?? '').trim() !== parsed.row.category;
    const { error } = await supabase
      .from('menu_items')
      .update({
        ...parsed.row,
        ...(categoryChanged ? { sort_order: endOfCategory(rows, parsed.row.category, id) } : {}),
      })
      .eq('id', id);
    if (error) return fail(`Could not save: ${error.message}`);

    if (categoryChanged) await normalizeOrder();
    await ensureCategoryLabel(parsed.row.category);
    refreshSite();
    return succeed(categoryChanged ? `Saved and moved to “${parsed.row.category}”.` : 'Changes saved.', id);
  } catch (error) {
    return fail(error instanceof Error ? `Could not save: ${error.message}` : 'Could not save.');
  }
}

export async function deleteItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const id = toId(formData.get('id'));
  if (id === null) return fail('That dish could not be identified.');

  try {
    const supabase = getSupabaseAdmin();
    const { data: item } = await supabase.from('menu_items').select('id, name').eq('id', id).maybeSingle();
    if (!item) return fail('That dish no longer exists.');

    // Photos first: remove their rows, then their files, then the dish itself.
    const { data: images } = await supabase.from('menu_item_images').select('id, image_url').eq('menu_item_id', id);
    const prefix = menuImagePrefix(id);
    const paths = (images ?? [])
      .map((image) => storagePathFromUrl(image.image_url, supabaseUrl))
      .filter((path): path is string => Boolean(path && path.startsWith(prefix)));

    if (images?.length) {
      const { error: imageError } = await supabase.from('menu_item_images').delete().eq('menu_item_id', id);
      if (imageError) return fail(`Could not remove the dish’s photos: ${imageError.message}`);
    }

    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) return fail(`Could not delete: ${error.message}`);

    await removeObjects(paths);
    await sweepOrphans(prefix, new Set(), 0);
    await normalizeOrder();
    refreshSite();
    return succeed(`“${item.name}” deleted${paths.length ? `, with ${paths.length} photo${paths.length === 1 ? '' : 's'}` : ''}.`);
  } catch (error) {
    return fail(error instanceof Error ? `Could not delete: ${error.message}` : 'Could not delete.');
  }
}

export async function toggleAvailability(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const id = toId(formData.get('id'));
  if (id === null) return fail('That dish could not be identified.');
  const available = formData.get('next') === 'true';

  const { data, error } = await getSupabaseAdmin()
    .from('menu_items')
    .update({ is_available: available })
    .eq('id', id)
    .select('name')
    .maybeSingle();

  if (error) return fail(`Could not update: ${error.message}`);
  if (!data) return fail('That dish no longer exists.');

  refreshSite();
  return succeed(available ? `“${data.name}” is available again.` : `“${data.name}” marked unavailable.`, id);
}

export async function moveItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const id = toId(formData.get('id'));
  if (id === null) return fail('That dish could not be identified.');
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';

  try {
    const writes = planItemMove(await loadOrderRows(), id, direction);
    if (writes === null) return succeed(direction === 'up' ? 'Already first in its category.' : 'Already last in its category.', id);
    await applyOrder(writes);
    refreshSite();
    return succeed('Order updated.', id);
  } catch (error) {
    return fail(error instanceof Error ? `Could not reorder: ${error.message}` : 'Could not reorder.');
  }
}

export async function moveCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const category = readText(formData, 'category');
  if (!category) return fail('That category could not be identified.');
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';

  try {
    const result = await moveCategoryLabel(category, direction);
    if (result === 'noop') return succeed(`“${category}” is already ${direction === 'up' ? 'first' : 'last'}.`);
    refreshSite();
    return succeed(`“${category}” moved ${direction}.`);
  } catch (error) {
    return fail(error instanceof Error ? `Could not reorder: ${error.message}` : 'Could not reorder.');
  }
}

/**
 * Category order lives in category_labels.sort_order. Moving one makes sure
 * every current category has a row (created in today's display order), swaps
 * with its neighbour and renumbers 10, 20, 30…
 */
export async function moveCategoryLabel(category: string, direction: 'up' | 'down'): Promise<'moved' | 'noop'> {
  const supabase = getSupabaseAdmin();
  const [{ data: items }, { data: labels }] = await Promise.all([
    supabase.from('menu_items').select('id, category, sort_order'),
    supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
  ]);
  const labelMap = labelsByCategory((labels ?? []) as CategoryLabelRow[]);
  const names = orderCategoryGroups(groupByCategory(sortForAdmin((items ?? []) as OrderRow[])), labelMap).map((group) => group.name);
  for (const row of (labels ?? []) as CategoryLabelRow[]) if (!names.includes(row.category.trim())) names.push(row.category.trim());

  const index = names.indexOf(category);
  const neighbour = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || neighbour < 0 || neighbour >= names.length) return 'noop';
  [names[index], names[neighbour]] = [names[neighbour], names[index]];

  const rows = names.map((name, position) => {
    const existing = labelMap.get(name);
    return {
      category: name,
      name_uz: existing?.name_uz ?? name,
      name_ru: existing?.name_ru ?? name,
      name_en: existing?.name_en ?? name,
      sort_order: (position + 1) * 10,
    };
  });
  const { error } = await supabase.from('category_labels').upsert(rows, { onConflict: 'category' });
  if (error) throw new Error(error.message);
  return 'moved';
}
