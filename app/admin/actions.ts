'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSession, destroySession, isAuthenticated, verifyPassword } from '@/lib/auth';
import { computeReorder } from '@/lib/menu';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { MENU_CACHE_TAG } from '@/lib/supabase';
import type { MenuItem } from '@/lib/types';

export type FormState = { error?: string } | null;

/**
 * Every mutation re-checks the session server-side. The route guard is the
 * first line; this is the one that actually protects the database.
 */
function requireAdmin() {
  if (!isAuthenticated()) redirect('/admin/login?m=expired');
}

/** Public page + admin view are both refreshed, so an edit is live immediately. */
function refresh() {
  revalidateTag(MENU_CACHE_TAG);
  revalidatePath('/');
  revalidatePath('/admin');
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

// ---------------------------------------------------------------- auth

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'ADMIN_PASSWORD is not set on the server. Add it and restart the app.' };
  }

  const password = text(formData, 'password');
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

// ---------------------------------------------------------------- menu CRUD

function validate(formData: FormData): { error?: string; values?: Partial<MenuItem> } {
  const name = text(formData, 'name');
  const category = text(formData, 'category');

  if (!name) return { error: 'A dish needs a name.' };
  if (!category) return { error: 'Choose or type a category.' };

  const imageUrl = optionalText(formData, 'image_url');
  if (imageUrl && !/^(https?:\/\/|\/)/.test(imageUrl)) {
    return { error: 'The image link must start with https:// or /.' };
  }

  return {
    values: {
      name,
      category,
      description: optionalText(formData, 'description'),
      price: optionalText(formData, 'price'),
      image_url: imageUrl,
      is_available: formData.get('is_available') === 'on',
    },
  };
}

async function nextSortOrder(category: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('menu_items')
    .select('sort_order')
    .eq('category', category)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);

  const highest = data?.[0]?.sort_order;
  return typeof highest === 'number' ? highest + 10 : 10;
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  requireAdmin();

  const { error, values } = validate(formData);
  if (error || !values) return { error };

  try {
    const supabase = getSupabaseAdmin();
    const { error: writeError } = await supabase.from('menu_items').insert({
      ...values,
      sort_order: await nextSortOrder(values.category as string),
    });

    if (writeError) return { error: `Could not save: ${writeError.message}` };
  } catch {
    return { error: 'The server is missing its Supabase admin key, so nothing was saved.' };
  }

  refresh();
  redirect('/admin?m=created');
}

export async function updateItem(_prev: FormState, formData: FormData): Promise<FormState> {
  requireAdmin();

  const id = Number(text(formData, 'id'));
  if (!Number.isFinite(id)) return { error: 'That item could not be identified.' };

  const { error, values } = validate(formData);
  if (error || !values) return { error };

  const sortOrder = text(formData, 'sort_order');

  try {
    const supabase = getSupabaseAdmin();
    const { error: writeError } = await supabase
      .from('menu_items')
      .update({
        ...values,
        ...(sortOrder && Number.isFinite(Number(sortOrder))
          ? { sort_order: Number(sortOrder) }
          : {}),
      })
      .eq('id', id);

    if (writeError) return { error: `Could not save: ${writeError.message}` };
  } catch {
    return { error: 'The server is missing its Supabase admin key, so nothing was saved.' };
  }

  refresh();
  redirect('/admin?m=saved');
}

export async function deleteItem(formData: FormData): Promise<void> {
  requireAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) redirect('/admin?m=error');

  let failed = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    failed = Boolean(error);
  } catch {
    failed = true;
  }

  refresh();
  redirect(failed ? '/admin?m=error' : '/admin?m=deleted');
}

export async function toggleAvailability(formData: FormData): Promise<void> {
  requireAdmin();

  const id = Number(formData.get('id'));
  const makeAvailable = formData.get('next') === 'true';
  if (!Number.isFinite(id)) redirect('/admin?m=error');

  let failed = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: makeAvailable })
      .eq('id', id);
    failed = Boolean(error);
  } catch {
    failed = true;
  }

  refresh();
  if (failed) redirect('/admin?m=error');
  redirect(makeAvailable ? '/admin?m=available' : '/admin?m=unavailable');
}

/**
 * Reorder by swapping with the neighbour inside the same category, then
 * re-numbering that category 10, 20, 30… so sort_order never drifts into
 * duplicates or nulls — which is what makes repeated clicks reliable.
 */
export async function moveItem(formData: FormData): Promise<void> {
  requireAdmin();

  const id = Number(formData.get('id'));
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';

  let outcome = 'reordered';

  if (!Number.isFinite(id)) {
    outcome = 'error';
  } else {
    try {
      const supabase = getSupabaseAdmin();
      const { data: target } = await supabase
        .from('menu_items')
        .select('id, category')
        .eq('id', id)
        .single();

      if (!target) throw new Error('missing');

      const category = target.category as string | null;
      const query = supabase
        .from('menu_items')
        .select('id, sort_order')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });

      const { data: siblings } = await (category === null
        ? query.is('category', null)
        : query.eq('category', category));

      const writes = computeReorder(siblings ?? [], id, direction);

      if (writes === null) {
        // Already at the top or the bottom of its category — nothing to do.
        outcome = 'noop';
      } else {
        await Promise.all(
          writes.map((write) =>
            supabase.from('menu_items').update({ sort_order: write.sort_order }).eq('id', write.id),
          ),
        );
      }
    } catch {
      outcome = 'error';
    }
  }

  refresh();
  redirect(outcome === 'noop' ? '/admin' : `/admin?m=${outcome}`);
}
