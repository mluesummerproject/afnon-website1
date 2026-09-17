'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { useBasket } from '@/components/site/basket/BasketProvider';
import { useFavorite } from '@/components/site/menu/useFavorites';
import { HeartIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';
import { format, type Dictionary, type Locale } from '@/lib/i18n';
import { formatAmount } from '@/lib/menu-format';
import type { Dish } from '@/lib/types';

export type CardLabels = Pick<
  Dictionary['menu'],
  'add' | 'addAria' | 'inBasket' | 'increase' | 'decrease' | 'favoriteAdd' | 'favoriteRemove' | 'viewDish' | 'discount' | 'oldPrice' | 'unavailable' | 'currency'
>;

/** Width of the "Add" state per language (Inter 14px/600 label + 16px padding each side). */
const ADD_WIDTH: Record<Locale, number> = { uz: 104, ru: 108, en: 72 };
const STEPPER_WIDTH = 104;

/**
 * The Add button and the quantity stepper are ONE element. Its width animates
 * over 200ms while the two faces cross-fade; it is anchored bottom-right, so
 * the card itself never moves.
 */
export function AddControl({ dish, locale, labels }: { dish: Dish; locale: Locale; labels: CardLabels }) {
  const { quantityOf, add, increment, decrement } = useBasket();
  const quantity = quantityOf(dish.id);
  const state = quantity > 0 ? 'stepper' : 'add';
  const disabled = !dish.available;
  const addRef = useRef<HTMLButtonElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const [shownQuantity, setShownQuantity] = useState(quantity || 1);
  const previousState = useRef(state);

  useEffect(() => {
    if (quantity > 0) setShownQuantity(quantity);
  }, [quantity]);

  // Keep keyboard focus on a live control when the element morphs.
  useEffect(() => {
    const active = document.activeElement;
    if (previousState.current === 'add' && state === 'stepper' && active === addRef.current) plusRef.current?.focus();
    if (previousState.current === 'stepper' && state === 'add' && active && active.closest('.stepper-face')) addRef.current?.focus();
    previousState.current = state;
  }, [state]);

  return (
    <div
      className={`add-control ${disabled ? 'bg-ink/15 text-ink/50' : 'bg-accent text-white'}`}
      data-state={state}
      style={{ '--add-w': `${ADD_WIDTH[locale]}px` } as CSSProperties}
    >
      <button
        ref={addRef}
        type="button"
        className="add-face tap hit-44 absolute flex items-center justify-center gap-1 rounded-[18px] px-4 text-button disabled:cursor-not-allowed"
        onClick={(event) => add(dish.id, event.currentTarget)}
        disabled={disabled}
        aria-label={format(labels.addAria, { dish: dish.name })}
        tabIndex={state === 'add' ? 0 : -1}
        aria-hidden={state !== 'add' || undefined}
      >
        <PlusIcon className="add-plus" size={18} />
        <span className="add-label whitespace-nowrap">{labels.add}</span>
      </button>

      <div className="stepper-face" aria-hidden={state !== 'stepper' || undefined}>
        <button
          type="button"
          onClick={() => decrement(dish.id)}
          aria-label={format(labels.decrease, { dish: dish.name })}
          tabIndex={state === 'stepper' ? 0 : -1}
          className="tap hit-44 absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <MinusIcon size={16} />
        </button>
        <span
          className="absolute inset-y-0 left-9 right-9 flex items-center justify-center text-[15px] font-semibold tabular-nums"
          aria-live="polite"
        >
          <span className="sr-only">{format(labels.inBasket, { count: quantity })}</span>
          <span aria-hidden="true">{shownQuantity}</span>
        </span>
        <button
          ref={plusRef}
          type="button"
          onClick={() => increment(dish.id)}
          aria-label={format(labels.increase, { dish: dish.name })}
          tabIndex={state === 'stepper' ? 0 : -1}
          className="tap hit-44 absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export const PRICE_RESERVE = Math.max(STEPPER_WIDTH, ...Object.values(ADD_WIDTH)) + 8;

/**
 * Counts a price up from 0 to its value, once, the first time it is genuinely
 * on screen — never on re-entry, never for a card already scrolled past.
 * Mirrors useReveal's own fail-safe shape: a synchronous below-the-fold check
 * before paint avoids a flash of "0" for prices already in view on mount.
 */
function useCountUpOnView(target: number, active: boolean): [React.RefObject<HTMLParagraphElement>, number] {
  const ref = useRef<HTMLParagraphElement>(null);
  const [value, setValue] = useState(target);
  const started = useRef(false);

  const run = () => {
    if (started.current) return;
    started.current = true;
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setValue(0);
    const duration = 500;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // Interrupted before it finished — by an unmount, or by React re-running the
      // effect (StrictMode does exactly that in development). Never leave a price
      // frozen mid-count at "0": show the real value and let a re-run count again.
      started.current = false;
      setValue(target);
    };
  };

  useLayoutEffect(() => {
    if (!active) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return run();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (element.getBoundingClientRect().top <= viewportHeight * 0.94) return run();
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return [ref, value];
}

/** Current price in accent, old price struck through beside it — only when a real discount exists. */
export function PriceText({ dish, labels, size = 'card' }: { dish: Dish; labels: CardLabels; size?: 'card' | 'sheet' }) {
  const [priceRef, shownPrice] = useCountUpOnView(dish.priceValue ?? 0, size === 'card' && dish.priceValue !== null);

  if (dish.priceValue === null) {
    return dish.price ? <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-accent-ink">{dish.price}</p> : null;
  }
  const big = size === 'sheet' ? 'text-[22px] font-bold' : 'text-price';
  return (
    <p ref={priceRef} className="flex flex-wrap items-baseline gap-x-1 leading-tight">
      <span className={`whitespace-nowrap tabular-nums text-accent-ink ${big}`}>{formatAmount(size === 'card' ? shownPrice : dish.priceValue, '')}</span>
      <span className={`font-semibold text-accent-ink ${size === 'sheet' ? 'text-[15px]' : 'text-[12px]'}`}>{labels.currency}</span>
      {dish.oldPriceValue !== null ? (
        <s className={`whitespace-nowrap font-medium tabular-nums text-ink/60 ${size === 'sheet' ? 'ml-1 text-[15px]' : 'text-[12px]'}`}>
          <span className="sr-only">{format(labels.oldPrice, { price: formatAmount(dish.oldPriceValue, labels.currency) })}</span>
          <span aria-hidden="true">{formatAmount(dish.oldPriceValue, '')}</span>
        </s>
      ) : null}
      {dish.discountPercent ? <span className="sr-only">{format(labels.discount, { percent: dish.discountPercent })}</span> : null}
    </p>
  );
}

/** FeedUp-style corner ribbons: discount first, the dish badge stacked beneath. */
export function Ribbons({ dish }: { dish: Dish }) {
  if (!dish.discountPercent && !dish.badge) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1">
      {dish.discountPercent ? (
        <span className="rounded-[8px] bg-accent px-2 py-1 text-[12px] font-bold leading-none text-white">−{dish.discountPercent}%</span>
      ) : null}
      {dish.badge ? (
        <span className="max-w-full truncate rounded-[8px] bg-accent px-2 py-1 text-[11px] font-semibold leading-none text-white">{dish.badge}</span>
      ) : null}
    </span>
  );
}

export function FavoriteButton({ dish, labels }: { dish: Dish; labels: CardLabels }) {
  const [active, toggle] = useFavorite(dish.id);
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={format(active ? labels.favoriteRemove : labels.favoriteAdd, { dish: dish.name })}
      onClick={() => {
        if (toggle()) setBurst((value) => value + 1);
      }}
      className="tap hit-44 absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80"
    >
      {burst > 0 ? <span key={burst} className="heart-pulse" aria-hidden="true" /> : null}
      <span key={`heart-${burst}`} className={`relative ${burst > 0 ? 'heart-burst' : ''}`}>
        <HeartIcon filled={active} size={20} className={active ? 'text-accent-ink' : 'text-ink/70'} />
      </span>
    </button>
  );
}
