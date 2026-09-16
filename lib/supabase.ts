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

/** Cache tags busted by admin writes, so edits appear without a redeploy. */
export const MENU_CACHE_TAG = 'menu';
export const VIDEOS_CACHE_TAG = 'videos';
export const BANNERS_CACHE_TAG = 'banners';
export const SETTINGS_CACHE_TAG = 'settings';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * READ client. Deliberately uncached.
 *
 * These reads were previously held in Next's data cache for five minutes and
 * refreshed by `revalidateTag` after every admin write. That only holds while
 * the write and the read happen in the same server process: a second instance,
 * a separate deployment or a build that predates the write all keep serving
 * the old menu, and the symptom — a dish that exists in the database but is
 * invisible on the site — looks like data loss to staff. The page is already
 * dynamic (the language comes from a cookie), each render dedupes its reads
 * through React `cache`, and the payload is a few kilobytes, so what caching
 * bought here never justified the risk of a menu that silently lies.
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  ...options,
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' } as RequestInit),
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
