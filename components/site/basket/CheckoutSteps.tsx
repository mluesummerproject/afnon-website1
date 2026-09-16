'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { PlacedOrder } from '@/app/actions/order';
import type { BasketDishInfo } from '@/components/site/basket/BasketProvider';
import { BasketIcon, ChevronIcon, PinIcon, TelegramIcon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';
import { composeOrderMessage, orderUrl, type BasketLine, type OrderTemplates } from '@/lib/basket';
import { displayUzPhone, mapsLink, maskUzPhoneInput, type Fulfillment, type OrderField } from '@/lib/checkout';
import { format, localeMeta, type Dictionary, type Locale } from '@/lib/i18n';
import { formatAmount } from '@/lib/menu-format';
import { ease } from '@/lib/motion';

export type OrderCopy = Dictionary['order'];
export type CheckoutStep = 'fulfillment' | 'details' | 'review';
export const CHECKOUT_STEPS: CheckoutStep[] = ['fulfillment', 'details', 'review'];

export type Draft = {
  fulfillment: Fulfillment | null;
  phone: string;
  name: string;
  address: string;
  addressNote: string;
  geo: { lat: number; lng: number } | null;
};

export const EMPTY_DRAFT: Draft = { fulfillment: null, phone: '+998 ', name: '', address: '', addressNote: '', geo: null };

/** The brand seed — the same shape the intro scatters and fly-to-basket throws. */
function Seed({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 13" aria-hidden="true" focusable="false" className={className}>
      <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ header */

export function CheckoutHeader({ step, copy, onBack }: { step: CheckoutStep; copy: OrderCopy; onBack: () => void }) {
  const index = CHECKOUT_STEPS.indexOf(step);
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label={copy.back} className="tap -ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fill">
          <ChevronIcon direction="left" size={20} />
        </button>
        <h2 id="basket-title" className="min-w-0 flex-1 truncate text-[18px] font-bold">
          {copy.steps[step]}
        </h2>
        <span className="shrink-0 text-[13px] tabular-nums text-ink/60">{format(copy.stepOf, { step: index + 1, total: CHECKOUT_STEPS.length })}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {CHECKOUT_STEPS.map((name, position) => (
          <span key={name} className="h-1 overflow-hidden rounded-full bg-ink/10">
            <motion.span
              className="block h-full origin-left rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: position <= index ? 1 : 0 }}
              transition={{ duration: 0.32, ease }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ step 1: type */

export function FulfillmentStep({ copy, value, onChoose }: { copy: OrderCopy; value: Fulfillment | null; onChoose: (value: Fulfillment) => void }) {
  const options = [
    { key: 'delivery' as const, title: copy.delivery, hint: copy.deliveryHint, Icon: PinIcon },
    { key: 'pickup' as const, title: copy.pickup, hint: copy.pickupHint, Icon: BasketIcon },
  ];
  return (
    <div role="radiogroup" aria-labelledby="basket-title" className="grid grid-cols-2 gap-3 px-4 pb-6 pt-1">
      {options.map(({ key, title, hint, Icon }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChoose(key)}
            className={`tap relative flex min-h-[148px] flex-col items-start rounded-[16px] border p-4 text-left transition-colors duration-200 ${
              selected ? 'border-accent bg-accent/[0.05] shadow-card' : 'border-line bg-card hover:border-ink/25'
            }`}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 ${selected ? 'bg-accent text-white' : 'bg-accent/[0.08] text-accent'}`}>
              <Icon size={22} />
            </span>
            <span className="mt-auto block pt-4 text-[16px] font-bold leading-tight text-ink">{title}</span>
            <span className="mt-1 block text-[13px] leading-snug text-ink/60">{hint}</span>
            {selected ? (
              <motion.span layoutId="fulfillment-seed" className="absolute right-3.5 top-3.5 text-accent" transition={{ type: 'spring', stiffness: 520, damping: 34 }}>
                <Seed className="h-4 w-3" />
              </motion.span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------- step 2: details */

function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-[13px] font-semibold text-ink/80">
      {children}
      {optional ? <span className="font-normal text-ink/50">· {optional}</span> : null}
    </label>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.p id={id} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2, ease }} className="mt-1.5 flex gap-1.5 text-[13px] leading-snug text-accent">
      <span aria-hidden="true" className="font-bold">!</span>
      {children}
    </motion.p>
  );
}

const inputClass = (invalid: boolean) => `field mt-1.5 ${invalid ? 'border-accent ring-1 ring-accent' : 'border-line-strong'}`;

type GeoState = 'idle' | 'locating' | 'denied' | 'unsupported' | 'failed';

export function DetailsStep({
  copy,
  draft,
  invalid,
  pickupAddress,
  privacy,
  onChange,
  onSubmit,
  onBlurPhone,
  onTrap,
}: {
  copy: OrderCopy;
  draft: Draft;
  invalid: OrderField[];
  pickupAddress: string | null;
  privacy: string;
  onChange: (patch: Partial<Draft>) => void;
  onSubmit: () => void;
  onBlurPhone: () => void;
  /** Reports the honeypot's value; the field only exists on this step, the submit happens on the next. */
  onTrap: (value: string) => void;
}) {
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const delivery = draft.fulfillment === 'delivery';
  const bad = (field: OrderField) => invalid.includes(field);
  const firstInvalid = useRef<OrderField | null>(null);

  // Bring the first problem into view and focus when a Continue is refused.
  useEffect(() => {
    const first = invalid[0] ?? null;
    if (first && first !== firstInvalid.current) document.getElementById(`order-${first}`)?.focus();
    firstInvalid.current = first;
  }, [invalid]);

  const onPhone = (next: string) => {
    let masked = maskUzPhoneInput(next);
    // Backspace over a grouping space removes the digit before it, instead of doing nothing.
    // The +998 prefix itself is fixed: backspacing into it changes nothing.
    const national = draft.phone.slice(4).replace(/\D/g, '');
    if (next.length < draft.phone.length && masked === draft.phone && national.length > 0) masked = maskUzPhoneInput(`+998${national.slice(0, -1)}`);
    onChange({ phone: masked });
  };

  const locate = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoState('unsupported');
      return;
    }
    setGeoState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ geo: { lat: position.coords.latitude, lng: position.coords.longitude } });
        setGeoState('idle');
      },
      (error) => setGeoState(error.code === error.PERMISSION_DENIED ? 'denied' : 'failed'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const geoMessage = geoState === 'denied' ? copy.locationDenied : geoState === 'unsupported' ? copy.locationUnsupported : geoState === 'failed' ? copy.locationFailed : null;

  return (
    <form
      id="order-details"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="relative space-y-5 px-4 pb-6 pt-1"
    >
      {/* Honeypot — invisible to people and to assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" onChange={(event) => onTrap(event.target.value)} />
        </label>
      </div>

      <div>
        <FieldLabel htmlFor="order-phone">{copy.phone}</FieldLabel>
        <input
          id="order-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={draft.phone}
          onChange={(event) => onPhone(event.target.value)}
          onFocus={(event) => {
            const end = event.target.value.length;
            window.requestAnimationFrame(() => event.target.setSelectionRange(end, end));
          }}
          onBlur={onBlurPhone}
          aria-invalid={bad('phone') || undefined}
          aria-describedby={bad('phone') ? 'order-phone-error' : 'order-phone-hint'}
          className={`${inputClass(bad('phone'))} tabular-nums tracking-[0.01em]`}
        />
        {bad('phone') ? <FieldError id="order-phone-error">{copy.phoneError}</FieldError> : <p id="order-phone-hint" className="mt-1.5 text-[12px] text-ink/60">{copy.phoneHint}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="order-name" optional={copy.optional}>
          {copy.name}
        </FieldLabel>
        <input
          id="order-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-invalid={bad('name') || undefined}
          className={inputClass(bad('name'))}
        />
        {bad('name') ? <FieldError id="order-name-error">{copy.nameError}</FieldError> : null}
      </div>

      {delivery ? (
        <>
          <div>
            <FieldLabel htmlFor="order-address">{copy.address}</FieldLabel>
            <textarea
              id="order-address"
              rows={2}
              maxLength={500}
              autoComplete="street-address"
              value={draft.address}
              placeholder={copy.addressPlaceholder}
              onChange={(event) => onChange({ address: event.target.value })}
              aria-invalid={bad('address') || undefined}
              aria-describedby={bad('address') ? 'order-address-error' : undefined}
              className={`${inputClass(bad('address'))} placeholder:text-ink/40`}
            />
            {bad('address') ? <FieldError id="order-address-error">{copy.addressError}</FieldError> : null}
          </div>

          <div>
            <FieldLabel htmlFor="order-addressNote" optional={copy.optional}>
              {copy.addressNote}
            </FieldLabel>
            <input
              id="order-addressNote"
              type="text"
              maxLength={200}
              value={draft.addressNote}
              onChange={(event) => onChange({ addressNote: event.target.value })}
              aria-invalid={bad('addressNote') || undefined}
              className={inputClass(bad('addressNote'))}
            />
            {bad('addressNote') ? <FieldError id="order-addressNote-error">{copy.addressNoteError}</FieldError> : null}
          </div>

          <div aria-live="polite">
            {draft.geo ? (
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-accent/[0.06] px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-accent">
                  <PinIcon size={18} />
                  {copy.located}
                </span>
                <button type="button" onClick={() => onChange({ geo: null })} className="tap -mr-2 min-h-[44px] px-2 text-[13px] font-medium text-ink/60 underline underline-offset-2">
                  {copy.locationRemove}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={locate}
                disabled={geoState === 'locating'}
                className="tap flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-card text-[14px] font-semibold text-ink disabled:cursor-wait disabled:opacity-70"
              >
                <PinIcon size={18} className="text-accent" />
                {geoState === 'locating' ? copy.locating : copy.locate}
              </button>
            )}
            {geoMessage && !draft.geo ? <p className="mt-1.5 text-[12px] leading-snug text-ink/60">{geoMessage}</p> : null}
          </div>
        </>
      ) : (
        <div className="rounded-[12px] bg-fill px-3.5 py-3">
          <p className="text-[12px] font-semibold text-ink/60">{copy.pickupFrom}</p>
          <p className="mt-0.5 text-[15px] font-medium text-ink">{pickupAddress ?? copy.pickupAddressMissing}</p>
        </div>
      )}

      <PaymentNote copy={copy} fulfillment={draft.fulfillment} />
      <p className="text-[12px] leading-snug text-ink/60">{privacy}</p>

      {/* Lets Enter on the keyboard move on; the visible button lives in the sheet footer. */}
      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
    </form>
  );
}

/** Display-only. There is no payment control anywhere in the flow: staff take cash in person. */
function PaymentNote({ copy, fulfillment }: { copy: OrderCopy; fulfillment: Fulfillment | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-[12px] border border-line px-3.5 py-3">
      <span className="text-[13px] font-semibold text-ink/60">{copy.payment}</span>
      <span className="text-right text-[14px] font-semibold text-ink">{fulfillment === 'delivery' ? copy.payDelivery : copy.payPickup}</span>
    </div>
  );
}

/* ---------------------------------------------------------- step 3: review */

export function ReviewStep({
  copy,
  draft,
  lines,
  dishes,
  total,
  currency,
  pickupAddress,
  onEdit,
}: {
  copy: OrderCopy;
  draft: Draft;
  lines: BasketLine[];
  dishes: Map<number, BasketDishInfo>;
  total: number;
  currency: string;
  pickupAddress: string | null;
  onEdit: (step: CheckoutStep) => void;
}) {
  const delivery = draft.fulfillment === 'delivery';
  const name = draft.name.trim();
  return (
    <div className="space-y-5 px-4 pb-6 pt-1">
      <section aria-labelledby="review-items">
        <SectionTitle id="review-items" edit={copy.edit} onEdit={null}>
          {copy.reviewItems}
        </SectionTitle>
        <ul className="mt-1 divide-y divide-line">
          {lines.map((line) => {
            const dish = dishes.get(line.id);
            if (!dish || dish.priceValue === null) return null;
            return (
              <li key={line.id} className="flex items-baseline gap-3 py-2.5">
                <span className="min-w-0 flex-1 text-[15px] leading-snug text-ink">
                  {dish.name} <span className="whitespace-nowrap font-semibold tabular-nums text-ink/60">× {line.qty}</span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-ink">{formatAmount(dish.priceValue * line.qty, currency)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line-strong pt-3">
          <span className="text-[15px] font-bold">{copy.total}</span>
          <span className="text-price tabular-nums text-accent">{formatAmount(total, currency)}</span>
        </div>
      </section>

      <section aria-labelledby="review-type" className="rounded-[14px] bg-fill px-3.5 py-3">
        <SectionTitle id="review-type" edit={copy.edit} onEdit={() => onEdit('fulfillment')}>
          {copy.reviewType}
        </SectionTitle>
        <p className="text-[15px] font-semibold text-ink">{delivery ? copy.delivery : copy.pickup}</p>
        {!delivery ? <p className="mt-0.5 text-[13px] text-ink/60">{pickupAddress ?? copy.pickupAddressMissing}</p> : null}
      </section>

      <section aria-labelledby="review-contact" className="rounded-[14px] bg-fill px-3.5 py-3">
        <SectionTitle id="review-contact" edit={copy.edit} onEdit={() => onEdit('details')}>
          {copy.reviewPhone}
        </SectionTitle>
        <p className="text-[15px] font-semibold tabular-nums text-ink">{draft.phone.trim()}</p>
        {name ? <p className="mt-0.5 text-[14px] text-ink/70">{name}</p> : null}
        {delivery ? (
          <>
            <p className="mt-2 text-[12px] font-semibold text-ink/60">{copy.reviewAddress}</p>
            <p className="text-[14px] leading-snug text-ink">{draft.address.trim()}</p>
            {draft.addressNote.trim() ? <p className="text-[13px] leading-snug text-ink/60">{draft.addressNote.trim()}</p> : null}
            {draft.geo ? (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-accent">
                <PinIcon size={15} />
                {copy.locationShared}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <PaymentNote copy={copy} fulfillment={draft.fulfillment} />
    </div>
  );
}

function SectionTitle({ id, children, edit, onEdit }: { id: string; children: ReactNode; edit: string; onEdit: (() => void) | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 id={id} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/60">
        {children}
      </h3>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="tap -my-2 -mr-2 min-h-[44px] px-2 text-[13px] font-semibold text-accent">
          {edit}
        </button>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- confirmation */

export type PlacedWithDetails = { order: PlacedOrder; details: Draft; locale: Locale };

/** The message staff receive — the existing basket composer, with the order's code and details added. */
export function composePlacedMessage(placed: PlacedWithDetails, templates: OrderTemplates, copy: OrderCopy, currency: string): string {
  const { order, details, locale } = placed;
  const lines = order.items.map((item) => ({ id: item.id, qty: item.qty }));
  const dishes = new Map(order.items.map((item) => [item.id, { id: item.id, name: item.name, priceValue: item.unit_price, available: true }]));
  const m = copy.message;
  const delivery = details.fulfillment === 'delivery';
  const after = [
    format(m.type, { type: delivery ? copy.delivery : copy.pickup }),
    format(m.phone, { phone: displayUzPhone(order.phone) }),
    details.name.trim() ? format(m.name, { name: details.name.trim() }) : null,
    delivery && details.address.trim() ? format(m.address, { address: details.address.trim() }) : null,
    delivery && details.addressNote.trim() ? format(m.note, { note: details.addressNote.trim() }) : null,
    delivery && details.geo ? format(m.location, { url: mapsLink(details.geo) }) : null,
    m.payment,
    format(m.language, { language: localeMeta[locale].name }),
  ].filter((row): row is string => Boolean(row));
  return composeOrderMessage(lines, dishes, templates, currency, { afterGreeting: [format(m.code, { code: order.code })], afterTotal: after });
}

export function Confirmation({
  placed,
  copy,
  message,
  telegramUsername,
  onTelegram,
}: {
  placed: PlacedWithDetails;
  copy: OrderCopy;
  message: string;
  telegramUsername: string | null;
  onTelegram: () => void;
}) {
  const c = copy.confirmation;
  const [manualCopy, setManualCopy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({ ok: true, message: c.copied });
    } catch {
      setManualCopy(true);
    }
  };

  return (
    <div role="status" className="px-4 pb-6 pt-2">
      <div className="flex flex-col items-center text-center">
        {/* The seed settles into place: the same spring the fulfillment choice uses. */}
        <motion.span
          aria-hidden="true"
          initial={{ scale: 0.4, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/[0.08] text-accent"
        >
          <span className="pulse-dot absolute inset-3 rounded-full opacity-40" />
          <Seed className="relative h-7 w-[22px]" />
        </motion.span>
        <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-accent">{c.label}</p>
        <h2 id="basket-title" ref={headingRef} tabIndex={-1} className="mt-1 text-[22px] font-bold leading-tight outline-none">
          {c.title}
        </h2>

        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease, delay: 0.12 }}
          className="mt-5 w-full rounded-[16px] border border-accent/20 bg-accent/[0.04] px-4 py-4"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/60">{c.codeLabel}</p>
          <p className="mt-1 text-[34px] font-bold leading-none tracking-[0.02em] text-accent tabular-nums">{placed.order.code}</p>
          <p className="mt-3 text-[15px] leading-snug text-ink">{format(c.body, { phone: displayUzPhone(placed.order.phone) })}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-ink/60">{c.saved}</p>
        </motion.div>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-center text-[13px] text-ink/60">{c.faster}</p>
        <div className={`mt-3 grid gap-2 ${telegramUsername ? 'grid-cols-1 min-[400px]:grid-cols-2' : 'grid-cols-1'}`}>
          {telegramUsername ? (
            <a
              href={orderUrl(message, telegramUsername)}
              target="_blank"
              rel="noreferrer noopener"
              onClick={onTelegram}
              className="tap flex h-11 items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-card px-3 text-[14px] font-semibold text-ink"
            >
              <TelegramIcon size={18} className="text-accent" />
              {c.telegram}
            </a>
          ) : null}
          <button type="button" onClick={() => void copyText()} className="tap flex h-11 items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-card px-3 text-[14px] font-semibold text-ink">
            {c.copy}
          </button>
        </div>
        {manualCopy ? (
          <div className="mt-3">
            <p className="text-[12px] text-ink/60">{c.copyManual}</p>
            <textarea readOnly rows={6} value={message} onFocus={(event) => event.target.select()} className="field mt-1.5 border-line-strong text-[13px]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
