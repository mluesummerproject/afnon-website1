import { cache } from 'react';

import { isRenderableImage } from '@/lib/menu-format';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';

/** Active promo banners in the order staff arranged them. Never throws. */
export const getActiveBanners = cache(async (): Promise<Banner[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('banners')
    .select('id, image_url, title, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error) {
    console.error('[banners] read failed:', error.message);
    return [];
  }
  return ((data ?? []) as Banner[]).filter((banner) => isRenderableImage(banner.image_url));
});
