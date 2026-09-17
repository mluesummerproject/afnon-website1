'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { TOAST_EVENT, type ToastDetail } from '@/components/ui/toast';

type Item = ToastDetail & { id: number };

/** Public toasts sit at the top, under the header — clear of the bottom nav and floating buttons. */
export function SiteToaster({ closeLabel }: { closeLabel: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    let counter = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const id = ++counter;
      setItems((list) => [...list.slice(-1), { ...detail, id }]);
      window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), detail.ok ? 3200 : 6000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+8px)] z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            role={item.ok ? 'status' : 'alert'}
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[14px] bg-night px-4 py-3 text-[14px] leading-snug text-on-night shadow-sheet"
          >
            <span className="flex-1">{item.message}</span>
            {item.action ? (
              <button type="button" onClick={item.action.run} className="tap min-h-[44px] shrink-0 px-2 text-[14px] font-semibold text-on-night underline underline-offset-4">
                {item.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((entry) => entry.id !== item.id))}
              aria-label={closeLabel}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-on-night/70"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
