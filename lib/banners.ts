import { cache } from 'react';

import type { HeroSlide } from '@/components/site/HeroCarousel';
import { clean } from '@/lib/i18n';
import { isRenderableImage } from '@/lib/menu-format';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';

/**
 * Active banners — the homepage hero carousel — in the order staff arranged
 * them. Selected with `*` rather than a column list so the site keeps working
 * before and after the banner-link migration has been run. Never throws.
 */
export const getActiveBanners = cache(async (): Promise<Banner[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error) {
    console.error('[banners] read failed:', error.message);
    return [];
  }
  return ((data ?? []) as Banner[]).filter((banner) => isRenderableImage(banner.image_url));
});

/** The "Oshpaz tanlovi" (Chef's picks) section of the menu — where a banner with no link of its own leads. */
export const PICKS_ELEMENT_ID = 'picks';

/**
 * Turns the banners staff saved into hero slides, resolving each link once,
 * on the server.
 *
 * A link staff configured (a category, or an external page) always wins. A
 * category link only survives if that category is actually on the page:
 * pointing a guest at a heading that is not there (because every dish in it
 * was hidden, say) falls back to the Chef's picks rather than a dead banner.
 * A banner with no link at all leads to the Chef's picks too, so every tap on
 * the hero goes somewhere.
 */
export function heroSlides(banners: Banner[], categories: { key: string; slug: string }[]): HeroSlide[] {
  const slugByCategory = new Map(categories.map((category) => [category.key.trim(), category.slug]));

  return banners.map((banner) => {
    const value = banner.link_value?.trim();
    let target: HeroSlide['target'] = { kind: 'section', elementId: PICKS_ELEMENT_ID };

    if (banner.link_type === 'external' && value && /^https:\/\/\S+$/.test(value)) {
      target = { kind: 'external', href: value };
    } else if (banner.link_type === 'category' && value) {
      const slug = slugByCategory.get(value);
      if (slug) target = { kind: 'category', elementId: `cat-${slug}` };
    }

    return { id: banner.id, imageUrl: banner.image_url, title: clean(banner.title), target };
  });
}
