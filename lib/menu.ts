import { cache } from 'react';

import { categoryLabel, labelsByCategory, orderCategoryGroups } from '@/lib/categories';
import { clean, localizedText, type Dictionary, type Locale } from '@/lib/i18n';
import { categorySlug, isRenderableImage } from '@/lib/menu-format';
import { groupByCategory, sortForAdmin } from '@/lib/ordering';
import { dishPricing } from '@/lib/pricing';
import { ratingsByDish } from '@/lib/ratings';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  MENU_ITEM_COLUMNS,
  type CategoryLabelRow,
  type Dish,
  type DishCategory,
  type MenuImage,
  type MenuItem,
  type MenuResult,
} from '@/lib/types';

export { categorySlug, formatPrice, isOptimizableImage, isRenderableImage, parseAmount } from '@/lib/menu-format';

/**
 * Dishes, photos and category labels, read in parallel and returned localized.
 * Wrapped in React `cache`, so one read serves the whole request. Never throws.
 */
export const getMenu = cache(async (locale: Locale, dict: Dictionary): Promise<MenuResult> => {
  if (!isSupabaseConfigured) return { status: 'error', categories: [] };

  const [itemsResult, imagesResult, labelsResult, ratingsResult] = await Promise.all([
    supabase.from('menu_items').select(MENU_ITEM_COLUMNS).order('sort_order', { ascending: true, nullsFirst: false }).order('id', { ascending: true }),
    supabase
      .from('menu_item_images')
      .select('id, menu_item_id, image_url, sort_order, caption')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true }),
    supabase.from('category_labels').select('category, name_uz, name_ru, name_en, sort_order'),
    // Averages and counts are computed by the database (a view); raw ratings never reach a browser.
    supabase.from('dish_rating_summary').select('menu_item_id, average_rating, rating_count'),
  ]);

  if (itemsResult.error) {
    console.error('[menu] menu_items read failed:', itemsResult.error.message);
    return { status: 'error', categories: [] };
  }
  if (imagesResult.error) console.error('[menu] menu_item_images read failed:', imagesResult.error.message);
  if (labelsResult.error) console.error('[menu] category_labels read failed:', labelsResult.error.message);
  // A ratings hiccup must never take the menu down: without them, dishes simply show no stars.
  if (ratingsResult.error) console.error('[menu] dish_rating_summary read failed:', ratingsResult.error.message);
  const ratings = ratingsByDish(ratingsResult.error ? [] : ratingsResult.data);

  const imagesByDish = new Map<number, MenuImage[]>();
  for (const image of (imagesResult.data ?? []) as MenuImage[]) {
    if (image.menu_item_id === null || !isRenderableImage(image.image_url)) continue;
    imagesByDish.set(image.menu_item_id, [...(imagesByDish.get(image.menu_item_id) ?? []), image]);
  }

  const labels = labelsByCategory((labelsResult.data ?? []) as CategoryLabelRow[]);
  const rows = sortForAdmin((itemsResult.data ?? []) as MenuItem[]);
  const rank = new Map(rows.map((row, index) => [row.id, index]));
  const categories: DishCategory[] = [];
  const usedSlugs = new Set<string>();

  for (const group of orderCategoryGroups(groupByCategory(rows), labels)) {
    const dishes: Dish[] = [];

    for (const item of group.items) {
      const name = localizedText(item, 'name', locale);
      if (!name) continue; // never render a blank card

      // Photos arrive ordered by sort_order, so the first one is the cover. The
      // caption is the alt text; without one, the dish name in the visitor's language.
      const gallery = (imagesByDish.get(item.id) ?? []).map((image) => ({ src: image.image_url.trim(), alt: clean(image.caption) ?? name }));
      const legacy = isRenderableImage(item.image_url) ? [{ src: item.image_url.trim(), alt: name }] : [];

      dishes.push({
        id: item.id,
        name,
        description: localizedText(item, 'description', locale),
        ...dishPricing(item.price, item.old_price, dict.menu.currency),
        badge: clean(item.badge),
        available: item.is_available !== false,
        images: gallery.length > 0 ? gallery : legacy,
        rank: rank.get(item.id) ?? 0,
        rating: ratings.get(item.id) ?? null,
      });
    }

    if (dishes.length === 0) continue;

    let slug = categorySlug(group.name);
    for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${categorySlug(group.name)}-${suffix}`;
    usedSlugs.add(slug);

    categories.push({ key: group.name, label: categoryLabel(group.name, labels, locale), slug, dishes });
  }

  if (categories.length === 0) return { status: 'empty', categories: [] };
  return { status: 'ok', categories };
});
