'use client';

import type { CSSProperties } from 'react';

import { useBasket } from '@/components/site/basket/BasketProvider';
import { DishImage } from '@/components/site/menu/DishImage';
import { RatingPill } from '@/components/site/menu/RatingPill';
import { AddControl, FavoriteButton, PRICE_RESERVE, PriceText, Ribbons, type CardLabels } from '@/components/site/menu/DishParts';
import { useReveal } from '@/components/ui/motion/useReveal';
import { format, type Locale } from '@/lib/i18n';
import type { Dish } from '@/lib/types';

type DishCardProps = {
  dish: Dish;
  locale: Locale;
  labels: CardLabels;
  onOpen: (dish: Dish) => void;
  index?: number;
  variant?: 'grid' | 'rail';
  priority?: boolean;
};

/**
 * Card anatomy, top to bottom: 1:1 photo (ribbons, heart) · name (2 lines) ·
 * description (2 lines, or nothing at all) · price + Add on one row.
 */
export function DishCard({ dish, locale, labels, onOpen, index = 0, variant = 'grid', priority = false }: DishCardProps) {
  const { quantityOf } = useBasket();
  const ref = useReveal<HTMLElement>();
  const open = () => onOpen(dish);

  return (
    <article
      ref={ref}
      className={`dish-card tap-card reveal relative flex flex-col rounded-[14px] bg-card p-3 shadow-card ${
        variant === 'rail' ? 'w-[160px] shrink-0 snap-start' : 'h-full'
      }`}
      data-in-basket={quantityOf(dish.id) > 0}
      data-dish-id={dish.id}
      style={{ '--col2': index % 2, '--col3': index % 3, '--col4': index % 4, '--price-reserve': `${PRICE_RESERVE}px` } as CSSProperties}
    >
      <div className="relative">
        <button type="button" onClick={open} aria-label={format(labels.viewDish, { dish: dish.name })} className="block w-full rounded-[10px]">
          <span className={`block ${dish.available ? '' : 'opacity-60'}`}>
            <DishImage
              photo={dish.images[0]}
              priority={priority}
              sizes={variant === 'rail' ? '136px' : '(min-width: 1024px) 270px, (min-width: 768px) 30vw, 46vw'}
            />
          </span>
          {!dish.available ? (
            <span className="absolute inset-x-2 bottom-2 rounded-[8px] bg-ink/80 px-2 py-1 text-center text-[11px] font-semibold leading-tight text-white">
              {labels.unavailable}
            </span>
          ) : null}
        </button>
        <Ribbons dish={dish} />
        <RatingPill dish={dish} raised={!dish.available} />
        <FavoriteButton dish={dish} labels={labels} />
      </div>

      <h3 className="mt-2.5 text-dish-name text-ink">
        <button type="button" onClick={open} className="text-left">
          <span className="line-clamp-2">{dish.name}</span>
        </button>
      </h3>
      {dish.description ? <p className="dish-description mt-1 line-clamp-2 text-dish-desc text-ink/70">{dish.description}</p> : null}

      <div className="relative mt-auto pt-2.5">
        <div className="price-block flex min-h-9 flex-col justify-center">
          <PriceText dish={dish} labels={labels} />
        </div>
        <AddControl dish={dish} locale={locale} labels={labels} />
      </div>
    </article>
  );
}
