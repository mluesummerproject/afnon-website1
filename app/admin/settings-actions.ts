'use server';

import { fail, refreshSite, requireAdmin, succeed, type ActionResult } from '@/lib/admin';
import { SETTING_KEYS, validateSetting } from '@/lib/settings-core';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Saves the whole Settings form. Every field is validated first; nothing is
 * written unless all of them pass. An emptied field deletes its row, so the
 * site falls back to its built-in default instead of showing a blank.
 */
export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const upserts: { key: string; value: string }[] = [];
  const deletes: string[] = [];
  const problems: string[] = [];

  for (const key of SETTING_KEYS) {
    const raw = formData.get(key);
    const { value, error } = validateSetting(key, typeof raw === 'string' ? raw : '');
    if (error) problems.push(`${key.replace('_', ' ')}: ${error}`);
    else if (value === null) deletes.push(key);
    else upserts.push({ key, value });
  }

  if (problems.length > 0) return fail(problems.join(' '));

  const supabase = getSupabaseAdmin();
  if (upserts.length > 0) {
    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
    if (error) return fail(`Could not save settings: ${error.message}`);
  }
  if (deletes.length > 0) {
    const { error } = await supabase.from('site_settings').delete().in('key', deletes);
    if (error) return fail(`Could not clear settings: ${error.message}`);
  }

  refreshSite();
  return succeed('Settings saved. The website now shows the new details.');
}
