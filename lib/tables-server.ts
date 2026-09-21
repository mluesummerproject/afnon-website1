import 'server-only';

import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';

/**
 * Resolves a printed QR token to a table — SERVER-SIDE ONLY, with the
 * service-role key. `restaurant_tables` has no anon access at all (a client
 * that could read it would learn every table's token), so this is the one
 * place the token list is ever consulted.
 *
 * Returns null for an unknown token, an inactive table, or a string that
 * cannot possibly be one (matching the database's own token shape) — the
 * caller shows the same friendly "not active" page for every case, never a
 * distinction that would help someone enumerate tokens.
 */
export async function resolveTableByToken(token: string): Promise<{ id: number; tableNumber: string } | null> {
  if (!isAdminSupabaseConfigured) return null;
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) return null;

  const { data, error } = await getSupabaseAdmin()
    .from('restaurant_tables')
    .select('id, table_number, is_active')
    .eq('token', token)
    .maybeSingle();

  if (error || !data || data.is_active === false) return null;
  return { id: data.id, tableNumber: data.table_number };
}

/**
 * Whether supabase/migrations/0002_table_orders_and_dish_comments.sql has been
 * run (orders can carry a table). Until it has, /t/[token] stays the plain
 * feedback page and nothing can be ordered to a table, so the site never
 * offers what it cannot record.
 *
 * A positive answer is remembered for the life of the server process; a
 * negative one is rechecked at most every 30 seconds.
 */
let tableOrdersKnown = false;
let tableOrdersCheckedAt = 0;

export async function tableOrderingAvailable(): Promise<boolean> {
  if (!isAdminSupabaseConfigured) return false;
  if (tableOrdersKnown) return true;
  if (Date.now() - tableOrdersCheckedAt < 30_000) return false;
  const { error } = await getSupabaseAdmin().from('orders').select('table_id, table_number').limit(1);
  // Only "these columns do not exist" counts as not-run-yet (and is then remembered for 30s). A dropped
  // connection or a timeout says nothing about the schema, so it is retried on the next request instead.
  if (!error) tableOrdersKnown = true;
  else if (isMissingSchema(error.code)) tableOrdersCheckedAt = Date.now();
  return tableOrdersKnown;
}

/** Postgres/PostgREST codes for "no such column / table" — the migration has not been run. */
export function isMissingSchema(code: string | undefined): boolean {
  return code === '42703' || code === '42P01' || code === 'PGRST204' || code === 'PGRST205' || code === 'PGRST200';
}
