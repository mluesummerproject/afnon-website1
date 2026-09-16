import { cache } from 'react';

import { MAX_ACTIVE_VIDEOS } from '@/lib/media';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { PromoVideo } from '@/lib/types';

/** Up to five active films, in the order staff arranged them. Never throws. */
export const getActiveVideos = cache(async (): Promise<PromoVideo[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('promo_videos')
    .select('id, title, video_url, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(MAX_ACTIVE_VIDEOS);

  if (error) {
    console.error('[videos] read failed:', error.message);
    return [];
  }

  return ((data ?? []) as PromoVideo[]).filter((video) => /^https:\/\//.test(video.video_url ?? ''));
});
