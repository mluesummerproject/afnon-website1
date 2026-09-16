'use client';

import { useEffect, useState } from 'react';

import { setOrderStatus } from '@/app/admin/order-actions';
import { useT } from '@/components/admin/AdminLangProvider';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { format } from '@/lib/i18n';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

const chevron: Record<OrderStatus, string> = { new: 'text-paper', confirmed: 'text-anor', completed: 'text-positive', cancelled: 'text-ink-muted' };

const tone: Record<OrderStatus, string> = {
  new: 'border-anor bg-anor text-paper',
  confirmed: 'border-anor/30 bg-anor-tint text-anor',
  completed: 'border-positive/30 bg-positive/10 text-positive',
  cancelled: 'border-line-strong bg-paper-alt text-ink-muted',
};

/**
 * One tap on a phone opens the native picker; the choice saves at once. The
 * control shows the new status straight away, says "Saving…" while the server
 * confirms, and falls back to the stored status if the save fails.
 */
export function OrderStatusSelect({ id, code, status }: { id: number; code: string; status: OrderStatus }) {
  const t = useT();
  const [value, setValue] = useState<OrderStatus>(status);
  const [pending, run] = useAdminAction();

  useEffect(() => setValue(status), [status]);

  return (
    <label className="relative inline-flex shrink-0">
      <span className="sr-only">{format(t.orders.statusFor, { code })}</span>
      <select
        value={value}
        disabled={pending}
        aria-busy={pending}
        onChange={async (event) => {
          const next = event.target.value as OrderStatus;
          const previous = value;
          setValue(next);
          const result = await run(() => setOrderStatus(id, next));
          if (!result?.ok) setValue(previous);
        }}
        className={`tap min-h-[2.75rem] cursor-pointer appearance-none rounded-pill border py-2 pl-4 pr-9 text-label-lg font-semibold uppercase transition-colors duration-quick disabled:cursor-wait ${tone[value]}`}
      >
        {ORDER_STATUSES.map((option) => (
          <option key={option} value={option} className="bg-surface text-ink">
            {t.orders.statuses[option]}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" width="10" height="7" viewBox="0 0 12 9" fill="none" className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 opacity-80 ${chevron[value]}`}>
        <path d="M1 2L6 7L11 2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      {pending ? <span className="absolute -bottom-5 right-1 whitespace-nowrap text-micro text-ink-muted">{t.orders.saving}</span> : null}
    </label>
  );
}
