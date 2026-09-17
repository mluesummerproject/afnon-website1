'use client';

import { useEffect, useRef, useState } from 'react';

import { useBasket } from '@/components/site/basket/BasketProvider';
import { QuantityStepper } from '@/components/site/basket/QuantityStepper';
import { DishImage, PlaceholderTile } from '@/components/site/menu/DishImage';
import { FavoriteButton, PriceText, Ribbons, type CardLabels } from '@/components/site/menu/DishParts';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CloseIcon, PlusIcon } from '@/components/ui/icons';
import { format } from '@/lib/i18n';
import type { Dish } from '@/lib/types';

type PhotoSheetProps = {
  dish: Dish | null;
  onClose: () => void;
  labels: CardLabels & { close: string; photoPosition: string; showPhoto: string };
};

/**
 * The dish sheet: swipeable square photos, name and price, the full
 * description (never truncated) above the photo thumbnails, then Add or the
 * quantity stepper. Swipe the top edge down to dismiss.
 */
export function PhotoSheet({ dish, onClose, labels }: PhotoSheetProps) {
  const [shown, setShown] = useState<Dish | null>(dish);
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const { quantityOf, add, increment, decrement } = useBasket();

  useEffect(() => {
    if (dish) {
      setShown(dish);
      setIndex(0);
      rail.current?.scrollTo({ left: 0 });
    }
  }, [dish]);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(Math.round(element.scrollLeft / Math.max(1, element.clientWidth))));
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [shown]);

  if (!shown) return null;
  const photos = shown.images;
  const quantity = quantityOf(shown.id);

  const header = (
    <div className="flex justify-end px-2">
      <button type="button" onClick={onClose} aria-label={labels.close} className="tap -mt-5 flex h-11 w-11 items-center justify-center rounded-full text-ink/70">
        <CloseIcon />
      </button>
    </div>
  );

  const footer = (
    <div className="px-4 pt-3">
      {!shown.available ? (
        <p className="flex h-12 items-center justify-center rounded-[14px] bg-fill text-[15px] font-semibold text-ink/60">{labels.unavailable}</p>
      ) : quantity === 0 ? (
        <button
          type="button"
          onClick={(event) => add(shown.id, event.currentTarget)}
          aria-label={format(labels.addAria, { dish: shown.name })}
          className="tap flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-accent text-button text-white"
        >
          <PlusIcon size={18} />
          {labels.add}
        </button>
      ) : (
        <div className="flex h-12 items-center justify-between gap-3">
          <span className="text-[15px] font-semibold text-ink/70">{format(labels.inBasket, { count: quantity })}</span>
          <QuantityStepper
            size="lg"
            quantity={quantity}
            onIncrease={() => increment(shown.id)}
            onDecrease={() => decrement(shown.id)}
            increaseLabel={format(labels.increase, { dish: shown.name })}
            decreaseLabel={format(labels.decrease, { dish: shown.name })}
            quantityLabel={format(labels.inBasket, { count: quantity })}
          />
        </div>
      )}
    </div>
  );

  return (
    <BottomSheet open={Boolean(dish)} onClose={onClose} labelledBy="dish-sheet-title" header={header} footer={footer}>
      <div className="px-4 pb-5">
        <div className="relative">
          {photos.length > 0 ? (
            <div ref={rail} className="swipe-rail overflow-hidden rounded-[14px]">
              {photos.map((photo, position) => (
                <div key={`${photo.src}-${position}`}>
                  <DishImage photo={photo} sizes="(min-width: 560px) 528px, 92vw" priority={position === 0} rounded="rounded-[14px]" />
                </div>
              ))}
            </div>
          ) : (
            <PlaceholderTile rounded="rounded-[14px]" />
          )}
          <Ribbons dish={shown} />
          <FavoriteButton dish={shown} labels={labels} />
          {photos.length > 1 ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-night/70 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-on-night">
              {format(labels.photoPosition, { index: index + 1, total: photos.length })}
            </span>
          ) : null}
        </div>

        <h2 id="dish-sheet-title" className="mt-4 text-[20px] font-bold leading-tight">
          {shown.name}
        </h2>
        <div className="mt-1.5">
          <PriceText dish={shown} labels={labels} size="sheet" />
        </div>

        {shown.description ? <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.5] text-ink/70">{shown.description}</p> : null}

        {photos.length > 1 ? (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {photos.map((photo, position) => (
              <button
                key={`thumb-${photo.src}-${position}`}
                type="button"
                aria-label={format(labels.showPhoto, { index: position + 1 })}
                aria-current={position === index ? 'true' : undefined}
                onClick={() => rail.current?.scrollTo({ left: position * rail.current.clientWidth, behavior: 'smooth' })}
                className={`tap relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] ring-2 ring-offset-1 ${position === index ? 'ring-accent-ink' : 'ring-transparent'}`}
              >
                <DishImage photo={photo} sizes="56px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
