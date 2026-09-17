'use client';

import Image from 'next/image';

import { useBasket } from '@/components/site/basket/BasketProvider';
import { QuantityStepper } from '@/components/site/basket/QuantityStepper';
import { EmptyState } from '@/components/site/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TrashIcon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';
import { format, plural, type Dictionary, type Locale } from '@/lib/i18n';
import { formatAmount, isOptimizableImage } from '@/lib/menu-format';

type BasketSheetProps = {
  locale: Locale;
  basket: Dictionary['basket'];
  menu: Dictionary['menu'];
  onBrowse: () => void;
};

export function BasketSheet({ locale, basket, menu, onBrowse }: BasketSheetProps) {
  const { lines, dishes, count, total, isOpen, closeBasket, increment, decrement, remove, clear, checkoutUrl } = useBasket();

  const header = (
    <div className="flex items-center justify-between px-4 pb-3">
      <h2 id="basket-title" className="text-[18px] font-bold">
        {basket.title}
      </h2>
      {count > 0 ? <span className="text-[14px] text-ink/60">{plural(basket.count, count, locale)}</span> : null}
    </div>
  );

  const footer =
    lines.length > 0 ? (
      <div className="space-y-3 px-4 pt-3">
        {total.amount > 0 ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold">{total.complete ? basket.total : basket.totalPartial}</span>
            <span className="text-price text-accent-ink tabular-nums">{formatAmount(total.amount, menu.currency)}</span>
          </div>
        ) : null}
        {checkoutUrl ? (
          <>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                window.setTimeout(() => {
                  clear();
                  closeBasket();
                  toast({ ok: true, message: basket.sent });
                }, 150);
              }}
              className="tap flex h-12 w-full items-center justify-center rounded-[14px] bg-accent text-button text-white"
            >
              {basket.checkout}
            </a>
            <p className="text-center text-[12px] text-ink/60">{basket.note}</p>
          </>
        ) : (
          <p className="rounded-[12px] bg-fill px-3 py-3 text-center text-[13px] text-ink/70">{basket.noTelegram}</p>
        )}
      </div>
    ) : null;

  return (
    <BottomSheet open={isOpen} onClose={closeBasket} labelledBy="basket-title" header={header} footer={footer}>
      {lines.length === 0 ? (
        <div className="px-4 pb-8">
          <EmptyState kind="basket" text={basket.empty}>
            <button
              type="button"
              onClick={() => {
                closeBasket();
                window.setTimeout(onBrowse, 320);
              }}
              className="tap mt-4 h-11 rounded-[22px] bg-accent px-6 text-button text-white"
            >
              {basket.browse}
            </button>
          </EmptyState>
        </div>
      ) : (
        <ul className="divide-y divide-line px-4">
          {lines.map((line) => {
            const dish = dishes.get(line.id);
            if (!dish) return null;
            return (
              <li key={line.id} className="flex items-center gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-accent/[0.07]">
                  {dish.image ? (
                    <Image src={dish.image} alt="" fill sizes="56px" className="object-cover" unoptimized={!isOptimizableImage(dish.image)} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-dish-name">{dish.name}</p>
                  {dish.priceValue !== null ? (
                    <p className="mt-0.5 text-[14px] font-bold text-accent-ink tabular-nums">{formatAmount(dish.priceValue * line.qty, menu.currency)}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <QuantityStepper
                    quantity={line.qty}
                    onIncrease={() => increment(line.id)}
                    onDecrease={() => decrement(line.id)}
                    increaseLabel={format(menu.increase, { dish: dish.name })}
                    decreaseLabel={format(menu.decrease, { dish: dish.name })}
                    quantityLabel={format(menu.inBasket, { count: line.qty })}
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    aria-label={format(basket.remove, { dish: dish.name })}
                    className="tap -mr-2 flex h-11 w-11 items-center justify-center text-ink/50 hover:text-accent-ink"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
