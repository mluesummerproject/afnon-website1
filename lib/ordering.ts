/**
 * Menu ordering — pure functions, shared by the public page and the admin so
 * both always agree on what comes first.
 *
 * The model: rows are ordered by (sort_order, id). Categories appear in the
 * order of their earliest row; dishes within a category keep that same order.
 * Every move re-numbers the WHOLE menu 10, 20, 30… in its new display order,
 * which keeps categories contiguous and means one category can never leap
 * over another as a side effect of reordering inside it. Only rows whose
 * number actually changes are written.
 */

export const UNCATEGORISED = 'Other';

type Orderable = { id: number; category: string | null; sort_order: number | null };
export type OrderWrite = { id: number; sort_order: number };

export function categoryOf(item: Pick<Orderable, 'category'>): string {
  return item.category?.trim() || UNCATEGORISED;
}

const key = (item: Orderable): [number, number] => [item.sort_order ?? Number.MAX_SAFE_INTEGER, item.id];
const compare = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

/** Display order: categories by their earliest row, dishes by (sort_order, id). */
export function sortForAdmin<T extends Orderable>(items: T[]): T[] {
  const rank = new Map<string, [number, number]>();
  for (const item of items) {
    const category = categoryOf(item);
    const current = rank.get(category);
    if (current === undefined || compare(key(item), current) < 0) rank.set(category, key(item));
  }

  return [...items].sort((a, b) => {
    const categoryA = categoryOf(a);
    const categoryB = categoryOf(b);
    if (categoryA !== categoryB) return compare(rank.get(categoryA)!, rank.get(categoryB)!);
    return compare(key(a), key(b));
  });
}

/** Groups rows that are already in display order. */
export function groupByCategory<T extends Orderable>(items: T[]): { name: string; items: T[] }[] {
  const groups: { name: string; items: T[] }[] = [];
  const index = new Map<string, number>();
  for (const item of items) {
    const name = categoryOf(item);
    if (!index.has(name)) {
      index.set(name, groups.length);
      groups.push({ name, items: [] });
    }
    groups[index.get(name)!].items.push(item);
  }
  return groups;
}

/** 10, 20, 30… for rows in the given order; returns only the rows that change. */
export function renumber(ordered: Orderable[]): OrderWrite[] {
  return ordered
    .map((item, position) => ({ id: item.id, sort_order: (position + 1) * 10, previous: item.sort_order }))
    .filter((row) => row.previous !== row.sort_order)
    .map(({ id, sort_order }) => ({ id, sort_order }));
}

/** Moves one dish a single place within its category. Null when it cannot move. */
export function moveItem(items: Orderable[], id: number, direction: 'up' | 'down'): OrderWrite[] | null {
  const ordered = sortForAdmin(items);
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const neighbour = index + (direction === 'up' ? -1 : 1);
  if (neighbour < 0 || neighbour >= ordered.length) return null;
  if (categoryOf(ordered[neighbour]) !== categoryOf(ordered[index])) return null;

  [ordered[index], ordered[neighbour]] = [ordered[neighbour], ordered[index]];
  return renumber(ordered);
}

/** Moves a whole category one place. Null when it cannot move. */
export function moveCategory(items: Orderable[], category: string, direction: 'up' | 'down'): OrderWrite[] | null {
  const groups = groupByCategory(sortForAdmin(items));
  const index = groups.findIndex((group) => group.name === category);
  if (index < 0) return null;

  const neighbour = index + (direction === 'up' ? -1 : 1);
  if (neighbour < 0 || neighbour >= groups.length) return null;

  [groups[index], groups[neighbour]] = [groups[neighbour], groups[index]];
  return renumber(groups.flatMap((group) => group.items));
}

/**
 * A sort_order that places a dish at the end of `category` (or of the whole
 * menu for a new category). Callers renumber afterwards, so the value only
 * has to land in the right place, not be tidy.
 */
export function endOfCategory(items: Orderable[], category: string, excludeId?: number): number {
  const others = sortForAdmin(items.filter((item) => item.id !== excludeId));
  const inCategory = others.filter((item) => categoryOf(item) === category.trim());
  const last = (inCategory.length ? inCategory : others).at(-1);
  if (!last) return 10;
  return (last.sort_order ?? 0) + (inCategory.length ? 1 : 10);
}
