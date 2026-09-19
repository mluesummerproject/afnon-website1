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
