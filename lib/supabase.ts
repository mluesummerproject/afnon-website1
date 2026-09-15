import { createClient } from '@supabase/supabase-js';

/**
 * Public, READ-ONLY Supabase client.
 *
 * Uses the publishable/anon key, which is protected by the table's
 * public-read RLS policy. It must never be used for writes — admin mutations
 * go through lib/supabase-admin.ts on the server only.
 *
 * Both key names are accepted so an existing, working project keeps working:
 * the newer `PUBLISHABLE` name wins when present, otherwise the legacy `ANON`.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/** How long a cached menu response may live before Next revalidates it. */
export const MENU_REVALIDATE_SECONDS = 300;

/** Cache tag busted by every admin write, so edits appear without a redeploy. */
export const MENU_CACHE_TAG = 'menu';

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    // Opt the menu query into Next's data cache with an explicit ceiling and a
    // tag. Without this the response would either be re-fetched on every
    // request or held indefinitely — neither is what a live menu wants.
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        next: { revalidate: MENU_REVALIDATE_SECONDS, tags: [MENU_CACHE_TAG] },
      } as RequestInit),
  },
});
