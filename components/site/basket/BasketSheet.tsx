'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { markTelegramOpened, placeOrder, type PlaceOrderResult } from '@/app/actions/order';
import { useBasket } from '@/components/site/basket/BasketProvider';
import {
  CHECKOUT_STEPS,
  CheckoutHeader,
  composePlacedMessage,
  Confirmation,
  DetailsStep,
  EMPTY_DRAFT,
  FulfillmentStep,
  ReviewStep,
  type CheckoutStep,
  type Draft,
  type OrderCopy,
  type PlacedWithDetails,
} from '@/components/site/basket/CheckoutSteps';
import { QuantityStepper } from '@/components/site/basket/QuantityStepper';
import { EmptyState } from '@/components/site/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TrashIcon } from '@/components/ui/icons';
import { validateDetails, type OrderField } from '@/lib/checkout';
import { format, plural, type Dictionary, type Locale } from '@/lib/i18n';
import { formatAmount, isOptimizableImage } from '@/lib/menu-format';
import { ease } from '@/lib/motion';

type BasketSheetProps = {
  locale: Locale;
  basket: Dictionary['basket'];
  menu: Dictionary['menu'];
  order: OrderCopy;
  privacy: string;
  privacyLink: string;
  /** Signed render-time token (lib/antispam) — proves the order form was loaded. */
  token: string;
  /** From site_settings; null until the restaurant saves one. */
  pickupAddress: string | null;
  telegramUsername: string | null;
  /** Set on /t/[token]: the order goes to this table. The number is for display — the server looks the table up from the token. */
  table: { token: string; number: string } | null;
  onBrowse: () => void;
};

type View = 'basket' | CheckoutStep | 'done';
type SubmitError = Exclude<Extract<PlaceOrderResult, { status: 'error' }>['reason'], 'fields'> | 'fields';

const ORDER: View[] = ['basket', ...CHECKOUT_STEPS, 'done'];

/**
 * The basket, and — in the same spring sheet — the order flow it leads into:
 * how to receive it, contact details, review, and the confirmation. The order
 * is recorded on the server first; the basket is only cleared once it has
 * been, and any failure keeps both the basket and everything typed.
 */
export function BasketSheet({ locale, basket, menu, order, privacy, privacyLink, token, pickupAddress, telegramUsername, table, onBrowse }: BasketSheetProps) {
  const { lines, dishes, count, total, isOpen, closeBasket, increment, decrement, remove, clear } = useBasket();
  const [view, setView] = useState<View>('basket');
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<Draft>(table ? { ...EMPTY_DRAFT, fulfillment: 'table' } : EMPTY_DRAFT);
  const [invalid, setInvalid] = useState<OrderField[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [placed, setPlaced] = useState<PlacedWithDetails | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trap = useRef('');

  const go = useCallback((next: View) => {
    setView((current) => {
      setDirection(ORDER.indexOf(next) >= ORDER.indexOf(current) ? 1 : -1);
      return next;
    });
    setError(null);
    contentRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 });
  }, []);

  // A finished order resets once the sheet is closed; an unfinished one keeps its place.
  useEffect(() => {
    if (isOpen || view !== 'done') return;
    const timer = window.setTimeout(() => {
      setView('basket');
      setPlaced(null);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isOpen, view]);

  // Emptying the basket mid-checkout (another tab, a dish going unavailable) returns to the basket.
  useEffect(() => {
    if (lines.length === 0 && view !== 'basket' && view !== 'done') setView('basket');
  }, [lines.length, view]);

  const patch = useCallback((update: Partial<Draft>) => {
    setDraft((current) => {
      const next = { ...current, ...update };
      // Clear an error as soon as the field it points at becomes valid.
      setInvalid((fields) => (fields.length === 0 ? fields : validateDetails(next).invalid.filter((field) => fields.includes(field))));
      return next;
    });
  }, []);

  /** Moves focus to the first field that needs attention — only ever in answer to a Continue or a refused submit, never while typing. */
  const focusField = (field: OrderField | undefined) => {
    if (field) window.setTimeout(() => document.getElementById(`order-${field}`)?.focus({ preventScroll: false }), 260);
  };

  const checkDetails = () => {
    const { invalid: problems } = validateDetails(draft);
    setInvalid(problems);
    if (problems.length === 0) go('review');
    else focusField(problems[0]);
  };

  const orderable = lines.length > 0 && total.complete && total.amount > 0;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await placeOrder({
        token,
        company: trap.current,
        locale,
        fulfillment: table ? 'table' : draft.fulfillment,
        tableToken: table?.token,
        phone: draft.phone,
        name: draft.name,
        address: draft.address,
        addressNote: draft.addressNote,
        geo: draft.geo,
        lines: lines.map((line) => ({ id: line.id, qty: line.qty })),
        expectedTotal: total.amount,
      });
      if (result.status === 'ok') {
        // Recorded on the server — only now is it safe to empty the basket.
        setPlaced({ order: result.order, details: draft, locale });
        clear();
        go('done');
      } else if (result.reason === 'fields') {
        setInvalid(result.invalid);
        go('details');
        setError('fields');
        focusField(result.invalid[0]);
      } else {
        setError(result.reason);
      }
    } catch {
      setError('generic');
    } finally {
      setSubmitting(false);
    }
  };

  const message = useMemo(() => (placed ? composePlacedMessage(placed, basket, order, menu.currency) : ''), [placed, basket, order, menu.currency]);

  const onBack = () => {
    if (view === 'fulfillment') go('basket');
    else if (view === 'details') go('fulfillment');
    else if (view === 'review') go(table ? 'basket' : 'details');
  };

  const basketHeader = (
    <div className="flex items-center justify-between px-4 pb-3">
      <h2 id="basket-title" className="text-[18px] font-bold">
        {basket.title}
      </h2>
      {count > 0 ? <span className="text-[14px] text-ink/60">{plural(basket.count, count, locale)}</span> : null}
    </div>
  );

  const header = view === 'basket' || view === 'done' ? (view === 'basket' ? basketHeader : <div className="h-1" />) : <CheckoutHeader step={view} copy={order} onBack={onBack} steps={table ? ['review'] : undefined} />;

  const primary = 'tap flex h-12 w-full items-center justify-center rounded-[14px] bg-accent text-button text-white disabled:cursor-not-allowed disabled:opacity-50';

  const errorText = error && error !== 'fields' ? order.errors[error] : error === 'fields' ? order.errors.fields : null;

  const footer = (() => {
    if (view === 'basket') {
      if (lines.length === 0) return null;
      return (
        <div className="space-y-3 px-4 pt-3">
          {total.amount > 0 ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold">{total.complete ? basket.total : basket.totalPartial}</span>
              <span className="text-price text-accent tabular-nums">{formatAmount(total.amount, menu.currency)}</span>
            </div>
          ) : null}
          {orderable ? (
            <>
              <button type="button" onClick={() => go(table ? 'review' : 'fulfillment')} className={primary}>
                {table ? order.tableCta : order.cta}
              </button>
              <p className="text-center text-[12px] text-ink/60">{table ? order.tableBasketNote : order.basketNote}</p>
            </>
          ) : (
            <p className="rounded-[12px] bg-fill px-3 py-3 text-center text-[13px] text-ink/70">{order.priceless}</p>
          )}
        </div>
      );
    }
    if (view === 'fulfillment') {
      return (
        <div className="px-4 pt-3">
          <button type="button" disabled={!draft.fulfillment} onClick={() => go('details')} className={primary}>
            {order.next}
          </button>
        </div>
      );
    }
    if (view === 'details') {
      return (
        <div className="px-4 pt-3">
          <button type="submit" form="order-details" className={primary}>
            {order.next}
          </button>
        </div>
      );
    }
    if (view === 'review') {
      return (
        <div className="space-y-3 px-4 pt-3">
          <AnimatePresence initial={false}>
            {errorText ? (
              <motion.div
                key={error}
                role="alert"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease }}
                className="rounded-[12px] border-l-2 border-accent bg-accent/[0.06] px-3 py-2.5 text-[13px] leading-snug text-ink"
              >
                {errorText}
                {error === 'basketChanged' || error === 'expired' ? (
                  <button type="button" onClick={() => window.location.reload()} className="tap mt-2 block min-h-[40px] font-semibold text-accent underline underline-offset-2">
                    {order.errors.refresh}
                  </button>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <button type="button" onClick={() => void submit()} disabled={submitting} aria-busy={submitting} className={`${primary} disabled:cursor-wait disabled:opacity-80`}>
            {submitting ? order.submitting : errorText && error !== 'basketChanged' && error !== 'expired' ? order.errors.retry : order.submit}
          </button>
        </div>
      );
    }
    return (
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={() => {
            closeBasket();
            window.setTimeout(onBrowse, 320);
          }}
          className={primary}
        >
          {order.confirmation.done}
        </button>
      </div>
    );
  })();

  const body = (() => {
    switch (view) {
      case 'fulfillment':
        return (
          <FulfillmentStep
            copy={order}
            value={draft.fulfillment}
            onChoose={(value) => {
              patch({ fulfillment: value });
              window.setTimeout(() => go('details'), 220);
            }}
          />
        );
      case 'details':
        return (
          <DetailsStep
            copy={order}
            draft={draft}
            invalid={invalid}
            pickupAddress={pickupAddress}
            privacy={privacy}
            privacyLink={privacyLink}
            onChange={patch}
            onSubmit={checkDetails}
            onTrap={(value) => {
              trap.current = value;
            }}
            onBlurPhone={() => {
              const digits = draft.phone.replace(/\D/g, '').length;
              if (digits > 3 && validateDetails(draft).invalid.includes('phone')) setInvalid((fields) => (fields.includes('phone') ? fields : [...fields, 'phone']));
            }}
          />
        );
      case 'review':
        return <ReviewStep copy={order} draft={draft} lines={lines} dishes={dishes} total={total.amount} currency={menu.currency} pickupAddress={pickupAddress} table={table?.number ?? null} onEdit={go} />;
      case 'done':
        return placed ? (
          <Confirmation
            placed={placed}
            copy={order}
            message={message}
            telegramUsername={telegramUsername}
            onTelegram={() => void markTelegramOpened(placed.order.receipt).catch(() => undefined)}
          />
        ) : null;
      default:
        return lines.length === 0 ? (
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
                    {dish.image ? <Image src={dish.image} alt="" fill sizes="56px" className="object-cover" unoptimized={!isOptimizableImage(dish.image)} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-dish-name">{dish.name}</p>
                    {dish.priceValue !== null ? <p className="mt-0.5 text-[14px] font-bold text-accent tabular-nums">{formatAmount(dish.priceValue * line.qty, menu.currency)}</p> : null}
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
                      className="tap -mr-2 flex h-11 w-11 items-center justify-center text-ink/50 hover:text-accent"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        );
    }
  })();

  return (
    <BottomSheet open={isOpen} onClose={closeBasket} labelledBy="basket-title" header={header} footer={footer}>
      <div ref={contentRef} className="overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={view}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -28, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
}
