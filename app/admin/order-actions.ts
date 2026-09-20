'use server';

import { revalidatePath } from 'next/cache';

import { fail, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { getAdminDict } from '@/lib/admin-locale';
import { format } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isOrderStatus } from '@/lib/types';

/** Moves one order to another status. Orders are only ever read and changed here, server-side. */
export async function setOrderStatus(id: unknown, status: unknown): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const orderId = toId(id);
  if (orderId === null) return fail(t.actions.orderNotIdentified);
  if (!isOrderStatus(status)) return fail(t.actions.orderStatusInvalid);

  const { data, error } = await getSupabaseAdmin().from('orders').update({ status }).eq('id', orderId).select('id, order_code').maybeSingle();

  if (error) {
    console.error('[admin] order status change failed with code', error.code);
    return fail(t.actions.orderStatusFailed);
  }
  if (!data) return fail(t.actions.orderGone);

  revalidatePath('/admin', 'layout');
  return succeed(format(t.actions.orderStatusSaved, { code: data.order_code, status: t.orders.statuses[status] }), orderId);
}

/**
 * Permanently deletes one order. Staff-only (requireAdmin runs first, like every
 * admin action) and irreversible, so the UI asks for confirmation before it is
 * ever called. Nothing else in the app deletes orders — there is no automatic
 * or scheduled deletion.
 */
export async function deleteOrder(id: number): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const orderId = toId(id);
  if (orderId === null) return fail(t.actions.orderNotIdentified);

  const { data, error } = await getSupabaseAdmin().from('orders').delete().eq('id', orderId).select('order_code').maybeSingle();

  if (error) {
    console.error('[admin] order delete failed with code', error.code);
    return fail(t.actions.orderDeleteFailed);
  }
  if (!data) return fail(t.actions.orderGone);

  revalidatePath('/admin', 'layout');
  return succeed(format(t.actions.orderDeleted, { code: data.order_code }), orderId);
}
