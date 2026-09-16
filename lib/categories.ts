/** Category labels and order — pure. `category_labels` is a lookup keyed by the exact category text. */

import { clean, tidyText, type Locale } from '@/lib/i18n';
import type { CategoryLabelRow } from '@/lib/types';

export type LabelMap = Map<string, CategoryLabelRow>;

export function labelsByCategory(rows: CategoryLabelRow[]): LabelMap {
  const map: LabelMap = new Map();
  for (const row of rows) {
    if (typeof row?.category === 'string' && row.category.trim()) map.set(row.category.trim(), row);
  }
  return map;
}

/** Active language → Uzbek → the raw category text. Never blank. */
export function categoryLabel(raw: string, labels: LabelMap, locale: Locale): string {
  const key = raw.trim();
  const row = labels.get(key);
  const label = row ? (clean(row[`name_${locale}`]) ?? clean(row.name_uz)) : null;
  return tidyText(label ?? key);
}

/**
 * Categories with a label row follow its sort_order; ties and categories
 * without a row keep the kitchen's dish order, the unlabelled ones last.
 */
export function orderCategoryGroups<G extends { name: string }>(groups: G[], labels: LabelMap): G[] {
  return groups
    .map((group, index) => ({ group, index, row: labels.get(group.name.trim()) }))
    .sort((a, b) => {
      if (Boolean(a.row) !== Boolean(b.row)) return a.row ? -1 : 1;
      if (a.row && b.row) {
        const delta = (a.row.sort_order ?? 0) - (b.row.sort_order ?? 0);
        if (delta !== 0) return delta;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.group);
}
