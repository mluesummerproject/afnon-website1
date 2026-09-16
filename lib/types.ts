/* ==========================================================================
   Database rows — mirror the live Supabase schema exactly (inspected, not
   assumed). Nullable wherever the column is nullable.
   ========================================================================== */

export type MenuItem = {
  id: number;
  category: string | null;
  name: string | null;
  description: string | null;
  /** Stored as text — may be "45000", "45 000 soʻm" or empty. */
  price: string | null;
  /** Legacy single image. Still honoured when a dish has no gallery images. */
  image_url: string | null;
  is_available: boolean | null;
  sort_order: number | null;
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  /** numeric — PostgREST returns a number (a string is tolerated). */
  old_price: number | string | null;
  /** Short ribbon text such as "Yangi" or "Hit". */
  badge: string | null;
};

export type MenuImage = {
  id: number;
  menu_item_id: number | null;
  image_url: string;
  sort_order: number | null;
  /** Single-language caption; doubles as the photo's alt text on the public site. */
  caption: string | null;
};

export type PromoVideo = {
  id: number;
  title: string | null;
  video_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export type Message = {
  id: number;
  name: string;
  contact: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
};

export type Banner = {
  id: number;
  image_url: string;
  title: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export type CategoryLabelRow = {
  category: string;
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
  sort_order: number | null;
};

export type SettingRow = { key: string; value: string | null };

export const MENU_ITEM_COLUMNS =
  'id, category, name, description, price, image_url, is_available, sort_order, name_uz, name_ru, name_en, description_uz, description_ru, description_en, old_price, badge';

/* ==========================================================================
   Public view models — already localized, safe to hand to the UI.
   ========================================================================== */

export type DishPhoto = { src: string; alt: string };

export type Dish = {
  id: number;
  name: string;
  description: string | null;
  /** Display price text, formatted with the visitor's currency word. */
  price: string | null;
  /** Numeric price for totals and discounts; null when the stored price is not a plain number. */
  priceValue: number | null;
  /** Present only when a real discount applies (old price greater than price). */
  oldPriceValue: number | null;
  discountPercent: number | null;
  badge: string | null;
  available: boolean;
  /** Ordered by sort_order — the first photo is the cover. */
  images: DishPhoto[];
  /** Position in the kitchen's own sort_order across the whole menu (for Chef's picks). */
  rank: number;
};

export type DishCategory = {
  /** The raw database value — stable across languages. */
  key: string;
  label: string;
  slug: string;
  dishes: Dish[];
};

export type MenuResult =
  | { status: 'ok'; categories: DishCategory[] }
  | { status: 'empty'; categories: [] }
  | { status: 'error'; categories: [] };

export type MenuCategory = {
  name: string;
  slug: string;
  items: MenuItem[];
};
