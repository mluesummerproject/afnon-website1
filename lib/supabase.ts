import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase clients — anon/publishable key only, bounded by RLS.
 *
 * Both key names are accepted so an existing, working project keeps working:
 * the newer `PUBLISHABLE` name wins when present, otherwise the legacy `ANON`.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/** How long cached public reads may live before Next revalidates them. */
export const MENU_REVALIDATE_SECONDS = 300;

/** Cache tags busted by admin writes, so edits appear without a redeploy. */
export const MENU_CACHE_TAG = 'menu';
export const VIDEOS_CACHE_TAG = 'videos';
export const BANNERS_CACHE_TAG = 'banners';
export const SETTINGS_CACHE_TAG = 'settings';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * READ client. Every request carries both tags and a revalidation ceiling, so
 * reads are cached but never held indefinitely, and any admin write can
 * refresh them immediately.
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  ...options,
  global: {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        next: { revalidate: MENU_REVALIDATE_SECONDS, tags: [MENU_CACHE_TAG, VIDEOS_CACHE_TAG, BANNERS_CACHE_TAG, SETTINGS_CACHE_TAG] },
      } as RequestInit),
  },
});

/**
 * WRITE client for the one public write the site allows: inserting a
 * visitor's message. Explicitly uncached — a cached POST would silently
 * swallow repeat submissions.
 */
export const supabasePublicWriter = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  ...options,
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' } as RequestInit),
  },
});
