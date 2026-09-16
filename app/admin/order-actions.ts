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

  if (error) return fail(format(t.actions.orderStatusFailed, { reason: error.message }));
  if (!data) return fail(t.actions.orderGone);

  revalidatePath('/admin', 'layout');
  return succeed(format(t.actions.orderStatusSaved, { code: data.order_code, status: t.orders.statuses[status] }), orderId);
}
