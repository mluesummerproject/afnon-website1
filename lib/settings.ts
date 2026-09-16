import { cache } from 'react';

import { resolveSettings, rowsToStored, type ResolvedSettings } from '@/lib/settings-core';
import { siteFallback } from '@/lib/site';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/** Business info for this request: what the owner saved, lib/site.ts defaults for anything missing. */
export const getSiteSettings = cache(async (): Promise<ResolvedSettings> => {
  if (!isSupabaseConfigured) return resolveSettings({}, siteFallback);
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) console.error('[settings] read failed:', error.message);
  return resolveSettings(rowsToStored(data ?? []), siteFallback);
});
