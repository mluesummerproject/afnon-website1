import { menuSection } from '@/lib/site';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MenuCategory, MenuItem, MenuResult } from '@/lib/types';

const COLUMNS = 'id, category, name, description, price, image_url, is_available, sort_order';

/** Stable, URL-safe anchor for a category heading. */
export function categorySlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'category';
}

/**
 * Prices are stored as text, so they may arrive as "45000", "45 000 so‘m",
 * "12.50" or empty. Plain numbers get thousands separators and the configured
 * suffix; anything the kitchen has formatted deliberately is printed untouched.
 */
export function formatPrice(price: string | null | undefined): string | null {
  const raw = price?.trim();
  if (!raw) return null;

  const numeric = raw.replace(/[\s ]/g, '');
  if (/^\d+([.,]\d{1,2})?$/.test(numeric)) {
    const [whole, fraction] = numeric.replace(',', '.').split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const body = fraction ? `${grouped}.${fraction}` : grouped;
    return menuSection.currencySuffix ? `${body} ${menuSection.currencySuffix}` : body;
  }

  return raw;
}

/** Items with no category still need a home. */
const UNCATEGORISED = 'Other';

function groupByCategory(items: MenuItem[]): MenuCategory[] {
  const order: string[] = [];
  const buckets = new Map<string, MenuItem[]>();

  for (const item of items) {
    const name = item.category?.trim() || UNCATEGORISED;
    if (!buckets.has(name)) {
      buckets.set(name, []);
      order.push(name);
    }
    buckets.get(name)!.push(item);
  }

  return order.map((name) => ({
    name,
    slug: categorySlug(name),
    items: buckets.get(name) ?? [],
  }));
}

/**
 * Reads the live menu. Never throws — the UI renders a designed state for
 * every outcome instead of a raw error.
 */


export async function getMenu(): Promise<MenuResult> {

  if (!isSupabaseConfigured) {
    return {
      status: 'error',
      categories: [],
      message: 'The menu service is not configured.',
    };
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select(COLUMNS)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) {
    console.error('[menu] Supabase read failed:', error.message);
    return {
      status: 'error',
      categories: [],
      message: 'We could not load the menu just now.',
    };
  }

  const items = (data ?? []) as MenuItem[];
  if (items.length === 0) return { status: 'empty', categories: [] };

  return { status: 'ok', categories: groupByCategory(items) };
}

/**
 * Admin view: exactly the order guests see.
 *
 * The public page reads rows ordered by (sort_order, id) and groups them by
 * first appearance, so a category's position is decided by its earliest row
 * under that same ordering. Ranking categories by that key — rather than
 * alphabetically — keeps the dashboard a faithful preview, including ties.
 */
export function sortForAdmin(items: MenuItem[]): MenuItem[] {
  const key = (item: MenuItem): [number, number] => [
    item.sort_order ?? Number.MAX_SAFE_INTEGER,
    item.id,
  ];
  const compare = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

  const rank = new Map<string, [number, number]>();
  for (const item of items) {
    const category = item.category?.trim() || UNCATEGORISED;
    const current = rank.get(category);
    if (current === undefined || compare(key(item), current) < 0) rank.set(category, key(item));
  }

  return [...items].sort((a, b) => {
    const categoryA = a.category?.trim() || UNCATEGORISED;
    const categoryB = b.category?.trim() || UNCATEGORISED;

    if (categoryA !== categoryB) {
      return compare(rank.get(categoryA)!, rank.get(categoryB)!);
    }

    return compare(key(a), key(b));
  });
}

export { groupByCategory, UNCATEGORISED };

/**
 * Works out the new sort_order for every dish in a category after one item is
 * moved a single place. The whole category is re-numbered 10, 20, 30… so
 * sort_order can never drift into nulls or duplicates — which is what makes
 * repeated arrow clicks behave predictably.
 *
 * Returns null when the move is impossible (item not found, already at the end).
 */
export function computeReorder(
  siblings: { id: number; sort_order: number | null }[],
  id: number,
  direction: 'up' | 'down',
): { id: number; sort_order: number }[] | null {
  const step = direction === 'up' ? -1 : 1;
  const ordered = [...siblings];
  const index = ordered.findIndex((item) => item.id === id);
  const swapWith = index + step;

  if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return null;

  [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];

  return ordered.map((item, position) => ({ id: item.id, sort_order: (position + 1) * 10 }));
}
