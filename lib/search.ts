/**
 * Menu search — pure. Matches dish names in the visitor's language, forgiving
 * the ways people actually type on a phone: any case, extra spaces, Uzbek
 * oʻ / gʻ typed as o' or o‘ or just o, and Russian ё typed as е.
 */

export function normalizeForSearch(value: string): string {
  return value
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/['`‘’ʻʼ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

type Searchable = { name: string };
type Group<T extends Searchable> = { dishes: T[] };

/**
 * Keeps only dishes whose name contains every word of the query (in any
 * order), and only groups that still have a dish. An empty query returns the
 * groups unchanged.
 */
export function filterCategories<G extends Group<T>, T extends Searchable>(groups: G[], query: string): G[] {
  const words = normalizeForSearch(query).split(' ').filter(Boolean);
  if (words.length === 0) return groups;

  return groups
    .map((group) => ({
      ...group,
      dishes: group.dishes.filter((dish) => {
        const name = normalizeForSearch(dish.name);
        return words.every((word) => name.includes(word));
      }),
    }))
    .filter((group) => group.dishes.length > 0);
}
