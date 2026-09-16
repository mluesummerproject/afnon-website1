'use server';

import { moveCategoryLabel } from '@/app/admin/actions';
import { fail, readText, refreshSite, requireAdmin, succeed, type ActionResult } from '@/lib/admin';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Saves one category's three names and position. The category text itself (the key) never changes here. */
export async function saveCategoryLabel(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const category = readText(formData, 'category');
  if (!category) return fail('That category could not be identified.');

  const names = { name_uz: readText(formData, 'name_uz'), name_ru: readText(formData, 'name_ru'), name_en: readText(formData, 'name_en') };
  if (Object.values(names).some((name) => name.length > 80)) return fail('Category names can be at most 80 characters.');

  const rawOrder = readText(formData, 'sort_order');
  const sortOrder = rawOrder === '' ? 0 : Number(rawOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < -100000 || sortOrder > 100000) return fail('Position must be a whole number.');

  const { error } = await getSupabaseAdmin()
    .from('category_labels')
    .upsert(
      { category, name_uz: names.name_uz || null, name_ru: names.name_ru || null, name_en: names.name_en || null, sort_order: sortOrder },
      { onConflict: 'category' },
    );
  if (error) return fail(`Could not save “${category}”: ${error.message}`);

  refreshSite();
  return succeed(`“${category}” saved.`);
}

export async function moveCategoryFromTab(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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

/** Removes a label row — only for a category no dish uses any more. */
export async function deleteCategoryLabel(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();
  const category = readText(formData, 'category');
  if (!category) return fail('That category could not be identified.');

  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('category', category);
  if ((count ?? 0) > 0) return fail(`“${category}” still has dishes. Move or delete them first.`);

  const { error } = await supabase.from('category_labels').delete().eq('category', category);
  if (error) return fail(`Could not remove “${category}”: ${error.message}`);
  refreshSite();
  return succeed(`“${category}” removed.`);
}
