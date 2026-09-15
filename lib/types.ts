/** Mirrors the existing Supabase `menu_items` table exactly. */
export type MenuItem = {
  id: number;
  category: string | null;
  name: string | null;
  description: string | null;
  /** Stored as text in Supabase — may be "45000", "45 000 so‘m" or empty. */
  price: string | null;
  image_url: string | null;
  is_available: boolean | null;
  sort_order: number | null;
};

export type MenuCategory = {
  name: string;
  /** Stable anchor id derived from the category name. */
  slug: string;
  items: MenuItem[];
};

export type MenuResult =
  | { status: 'ok'; categories: MenuCategory[] }
  | { status: 'empty'; categories: [] }
  | { status: 'error'; categories: []; message: string };
