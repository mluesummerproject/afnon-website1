'use client';

import { useRatings } from '@/components/site/menu/RatingsContext';
import { StarIcon } from '@/components/ui/icons';
import { format, plural } from '@/lib/i18n';
import { formatAverage } from '@/lib/ratings';
import type { Dish } from '@/lib/types';

/**
 * The average on a dish card: a small pill laid over the photo's bottom-left
 * corner. It sits on the picture, not in the text column, so a rated dish and
 * an unrated one have exactly the same card height — and an unrated dish
 * shows nothing at all, never a placeholder number or empty stars.
 */
export function RatingPill({ dish, raised = false }: { dish: Dish; raised?: boolean }) {
  const { summaryFor, copy, locale } = useRatings();
  const rating = summaryFor(dish);
  if (!rating) return null;

  return (
    <span
      role="img"
      aria-label={`${format(copy.summaryAria, { average: formatAverage(rating.average) })}, ${plural(copy.count, rating.count, locale)}`}
      className={`pointer-events-none absolute left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold leading-none tabular-nums text-ink shadow-sm ${raised ? 'bottom-9' : 'bottom-2'}`}
    >
      <StarIcon size={12} filled className="text-accent" />
      {formatAverage(rating.average)}
      <span className="font-medium text-ink/55">({rating.count})</span>
    </span>
  );
}
