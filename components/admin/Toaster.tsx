'use client';

import { useEffect, useState } from 'react';

import { TOAST_EVENT, type ToastDetail } from '@/components/admin/toast';

type Item = ToastDetail & { id: number };

/**
 * One feedback surface for the whole admin, anchored to the bottom of the
 * screen — the thumb zone on a phone. Successes fade quickly; failures stay
 * longer and are announced assertively.
 */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let counter = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const id = ++counter;
      setItems((list) => [...list.slice(-2), { ...detail, id }]);
      const life = detail.action ? 6000 : detail.ok ? 3500 : 8000;
      window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), life);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-end md:px-8 md:pb-8"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.ok ? 'status' : 'alert'}
          className={`pointer-events-auto flex w-full max-w-md animate-fade-rise items-start gap-3 rounded-hair border-l-4 bg-ink px-4 py-3.5 text-body-sm text-paper shadow-panel ${
            item.ok ? 'border-positive' : 'border-critical'
          }`}
        >
          <span className={`label mt-0.5 shrink-0 ${item.ok ? 'text-gold-soft' : 'text-anor-light'}`}>{item.ok ? 'Done' : 'Failed'}</span>
          <span className="flex-1">{item.message}</span>
          {item.action ? (
            <button
              type="button"
              onClick={() => {
                item.action?.run();
                setItems((list) => list.filter((entry) => entry.id !== item.id));
              }}
              className="label -my-2 shrink-0 px-2 font-medium uppercase text-gold-soft underline underline-offset-2 hover:text-paper"
            >
              {item.action.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setItems((list) => list.filter((entry) => entry.id !== item.id))}
            className="-my-2 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-paper/70 hover:text-paper"
            aria-label="Dismiss"
          >
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
