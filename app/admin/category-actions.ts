'use server';

import { moveCategoryLabel } from '@/app/admin/actions';
import { fail, readText, refreshSite, requireAdmin, succeed, type ActionResult } from '@/lib/admin';
import { getAdminDict } from '@/lib/admin-locale';
import { format } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Saves one category's three names and position. The category text itself (the key) never changes here. */
export async function saveCategoryLabel(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const category = readText(formData, 'category');
  if (!category) return fail(t.actions.categoryNotIdentified);

  const names = { name_uz: readText(formData, 'name_uz'), name_ru: readText(formData, 'name_ru'), name_en: readText(formData, 'name_en') };
  if (Object.values(names).some((name) => name.length > 80)) return fail(format(t.actions.categoryNameTooLong, { max: 80 }));

  const rawOrder = readText(formData, 'sort_order');
  const sortOrder = rawOrder === '' ? 0 : Number(rawOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < -100000 || sortOrder > 100000) return fail(t.actions.categoryPositionInvalid);

  const { error } = await getSupabaseAdmin()
    .from('category_labels')
    .upsert(
      { category, name_uz: names.name_uz || null, name_ru: names.name_ru || null, name_en: names.name_en || null, sort_order: sortOrder },
      { onConflict: 'category' },
    );
  if (error) return fail(format(t.actions.categorySaveFailed, { category, reason: error.message }));

  refreshSite();
  return succeed(format(t.actions.categorySaved, { category }));
}

export async function moveCategoryFromTab(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();
  const t = getAdminDict();
  const category = readText(formData, 'category');
  if (!category) return fail(t.actions.categoryNotIdentified);
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';
  try {
    const result = await moveCategoryLabel(category, direction);
    if (result === 'noop') return succeed(format(direction === 'up' ? t.actions.categoryAlreadyFirst : t.actions.categoryAlreadyLast, { category }));
    refreshSite();
    return succeed(format(direction === 'up' ? t.actions.categoryMovedUp : t.actions.categoryMovedDown, { category }), undefined, { moved: true });
  } catch (error) {
    return fail(format(t.actions.reorderFailed, { reason: error instanceof Error ? error.message : '—' }));
  }
}

/** Removes a label row — only for a category no dish uses any more. */
export async function deleteCategoryLabel(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();
  const t = getAdminDict();
  const category = readText(formData, 'category');
  if (!category) return fail(t.actions.categoryNotIdentified);

  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('category', category);
  if ((count ?? 0) > 0) return fail(format(t.actions.categoryHasDishes, { category }));

  const { error } = await supabase.from('category_labels').delete().eq('category', category);
  if (error) return fail(format(t.actions.categoryRemoveFailed, { category, reason: error.message }));
  refreshSite();
  return succeed(format(t.actions.categoryRemoved, { category }));
}
