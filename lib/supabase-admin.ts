import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * SERVER-ONLY Supabase client with write access.
 *
 * The service-role credential bypasses RLS, so this module must never be
 * imported from a Client Component. The `server-only` import above turns any
 * such import into a build error, and the key has no NEXT_PUBLIC_ prefix so it
 * is never inlined into the browser bundle.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

export const isAdminSupabaseConfigured = Boolean(supabaseUrl && serviceKey);

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) {
    // Deliberately does not echo any part of the credential.
    throw new Error(
      'Supabase admin credentials are missing. Set SUPABASE_SERVICE_ROLE_KEY in your environment.',
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Admin reads must always reflect the latest state.
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' } as RequestInit),
    },
  });
}
