'use server';

import { isAuthenticated } from '@/lib/auth';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import { tableOrderingAvailable } from '@/lib/tables-server';

export type LiveOrder = { id: number; code: string; type: 'delivery' | 'pickup' | 'table'; table: string | null };

export type OrderSignal =
  | { signedIn: false }
  | { signedIn: true; /** The newest order id in the database (0 when there are none). */ maxId: number; /** Orders newer than `sinceId`, oldest first — at most a handful. */ fresh: LiveOrder[] };

/**
 * What the staff panel polls every few seconds: the newest order id, and any
 * orders newer than the one the panel last saw. Staff-only — a request without
 * the session cookie learns nothing except that it is signed out — and it reads
 * with the server-only key, so nothing here widens what a browser can read.
 * It carries no phone number, name, address or items: just enough to say
 * "new order — Table 12".
 */
export async function getOrderSignal(sinceId: unknown): Promise<OrderSignal> {
  if (!isAuthenticated()) return { signedIn: false };
  if (!isAdminSupabaseConfigured) return { signedIn: true, maxId: 0, fresh: [] };

  const supabase = getSupabaseAdmin();
  const withTables = await tableOrderingAvailable();
  const columns = withTables ? 'id, order_code, fulfillment_type, table_number' : 'id, order_code, fulfillment_type';

  const newest = await supabase.from('orders').select('id').order('id', { ascending: false }).limit(1);
  if (newest.error) return { signedIn: true, maxId: typeof sinceId === 'number' ? sinceId : 0, fresh: [] };
  const maxId = Number(newest.data?.[0]?.id ?? 0);

  const since = typeof sinceId === 'number' && Number.isSafeInteger(sinceId) && sinceId >= 0 ? sinceId : null;
  if (since === null || maxId <= since) return { signedIn: true, maxId, fresh: [] };

  const rows = await supabase.from('orders').select(columns).gt('id', since).order('id', { ascending: true }).limit(10);
  const fresh = ((rows.data ?? []) as unknown as { id: number; order_code: string; fulfillment_type: LiveOrder['type']; table_number?: string | null }[]).map((row) => ({
    id: row.id,
    code: row.order_code,
    type: row.fulfillment_type,
    table: row.table_number ?? null,
  }));
  return { signedIn: true, maxId, fresh };
}
