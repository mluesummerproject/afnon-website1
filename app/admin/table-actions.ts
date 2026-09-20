'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { fail, readText, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { getAdminDict } from '@/lib/admin-locale';
import { format } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Matches the database's own token check (`^[A-Za-z0-9_-]{24,64}$`) with room to spare. */
function newToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Creates a table with a fresh, cryptographically random token. */
export async function createTable(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();
  const t = getAdminDict();

  const number = readText(formData, 'table_number');
  if (!number) return fail(t.actions.tableNumberRequired);
  if (number.length > 20) return fail(t.actions.tableNumberTooLong);

  const { data, error } = await getSupabaseAdmin().from('restaurant_tables').insert({ table_number: number, token: newToken() }).select('id, table_number').single();

  if (error) {
    if (error.code === '23505') return fail(t.actions.tableNumberDuplicate);
    console.error('[admin] table create failed with code', error.code);
    return fail(t.actions.tableCreateFailed);
  }

  revalidatePath('/admin', 'layout');
  return succeed(format(t.actions.tableCreated, { number: data.table_number }), data.id);
}

/** Activates or deactivates a table (called imperatively, outside a <form>). */
export async function setTableActive(id: number, active: boolean): Promise<ActionResult> {
  requireAdmin();
  const t = getAdminDict();

  const tableId = toId(id);
  if (tableId === null) return fail(t.actions.tableNotIdentified);

  const { data, error } = await getSupabaseAdmin().from('restaurant_tables').update({ is_active: active }).eq('id', tableId).select('id, table_number').maybeSingle();

  if (error) {
    console.error('[admin] table update failed with code', error.code);
    return fail(t.actions.tableToggleFailed);
  }
  if (!data) return fail(t.actions.tableGone);

  revalidatePath('/admin', 'layout');
  return succeed(format(active ? t.actions.tableActivated : t.actions.tableDeactivated, { number: data.table_number }), tableId);
}

/**
 * Deletes a table outright. The database itself refuses this (`on delete
 * restrict`) when feedback is attached — that Postgres error (23503) is
 * caught here and turned into a trilingual nudge toward deactivating instead,
 * so the table's review history is never silently at risk.
 */
export async function deleteTable(id: number): Promise<ActionResult> {
  requireAdmin();
  const t = getAdminDict();

  const tableId = toId(id);
  if (tableId === null) return fail(t.actions.tableNotIdentified);

  const { data: existing } = await getSupabaseAdmin().from('restaurant_tables').select('table_number').eq('id', tableId).maybeSingle();
  if (!existing) return fail(t.actions.tableGone);

  const { error } = await getSupabaseAdmin().from('restaurant_tables').delete().eq('id', tableId);

  if (error) {
    if (error.code === '23503') return fail(format(t.actions.tableDeleteBlocked, { number: existing.table_number }));
    console.error('[admin] table delete failed with code', error.code);
    return fail(t.actions.tableDeleteFailed);
  }

  revalidatePath('/admin', 'layout');
  return succeed(format(t.actions.tableDeleted, { number: existing.table_number }), tableId);
}
