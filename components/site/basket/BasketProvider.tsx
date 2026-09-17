'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  addItem,
  BASKET_STORAGE_KEY,
  basketTotal,
  composeOrderMessage,
  countItems,
  orderUrl,
  parseStoredBasket,
  removeItem,
  serializeBasket,
  setQuantity,
  type BasketDish,
  type BasketLine,
  type BasketTotal,
  type OrderTemplates,
} from '@/lib/basket';
import { vibrate } from '@/lib/client-scroll';

export type BasketDishInfo = BasketDish & { image: string | null; imageAlt: string };

type Flight = { key: number; from: { x: number; y: number }; to: { x: number; y: number } };

type BasketContextValue = {
  lines: BasketLine[];
  count: number;
  hydrated: boolean;
  dishes: Map<number, BasketDishInfo>;
  total: BasketTotal;
  quantityOf: (id: number) => number;
  add: (id: number, source?: HTMLElement | null) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  isOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  bump: number;
  glow: number;
  checkoutUrl: string | null;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function useBasket(): BasketContextValue {
  const context = useContext(BasketContext);
  if (!context) throw new Error('useBasket must be used inside BasketProvider');
  return context;
}

type BasketProviderProps = {
  dishes: BasketDishInfo[];
  templates: OrderTemplates;
  currency: string;
  telegramUsername: string | null;
  children: ReactNode;
};

/**
 * The basket lives in React state and this browser's localStorage only —
 * no server, no account. It survives reloads, stays in sync across tabs, and
 * turns into exactly one Telegram message at checkout.
 */
export function BasketProvider({ dishes, templates, currency, telegramUsername, children }: BasketProviderProps) {
  const reduce = useReducedMotion();
  const dishMap = useMemo(() => new Map(dishes.map((dish) => [dish.id, dish])), [dishes]);
  const orderable = useMemo(() => new Set(dishes.filter((dish) => dish.available).map((dish) => dish.id)), [dishes]);
  const orderableRef = useRef(orderable);
  orderableRef.current = orderable;

  const [lines, setLines] = useState<BasketLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [glow, setGlow] = useState(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const pendingFlights = useRef(0);
  const previousCount = useRef(0);

  // Restore once, trusting nothing that was stored.
  useEffect(() => {
    try {
      setLines(parseStoredBasket(window.localStorage.getItem(BASKET_STORAGE_KEY), orderableRef.current));
    } catch {
      setLines([]);
    }
    setHydrated(true);
  }, []);

  // A dish that disappears or becomes unavailable leaves the basket.
  useEffect(() => {
    setLines((current) => {
      const next = current.filter((line) => orderable.has(line.id));
      return next.length === current.length ? current : next;
    });
  }, [orderable]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(BASKET_STORAGE_KEY, serializeBasket(lines));
    } catch {
      /* storage unavailable — the basket still works for this visit */
    }
  }, [lines, hydrated]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === BASKET_STORAGE_KEY) setLines(parseStoredBasket(event.newValue, orderableRef.current));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const count = countItems(lines);

  // Badge: bounce on every change (after a landing flight, if one is in the air); glow on 0 → 1.
  useEffect(() => {
    if (!hydrated) {
      previousCount.current = count;
      return;
    }
    if (count === previousCount.current) return;
    if (previousCount.current === 0 && count > 0) setGlow((value) => value + 1);
    if (pendingFlights.current === 0) setBump((value) => value + 1);
    previousCount.current = count;
  }, [count, hydrated]);

  const add = useCallback(
    (id: number, source?: HTMLElement | null) => {
      if (!orderableRef.current.has(id)) return;
      setLines((current) => addItem(current, id));
      vibrate(10);

      if (reduce || !source) return;
      const target = Array.from(document.querySelectorAll<HTMLElement>('[data-basket-target]')).find((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
      });
      if (!target) return;
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      pendingFlights.current += 1;
      setFlights((current) => [
        ...current,
        {
          key: Date.now() + Math.random(),
          from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
          to: { x: to.left + to.width / 2, y: to.top + to.height / 2 },
        },
      ]);
    },
    [reduce],
  );

  const quantityOf = useCallback((id: number) => lines.find((line) => line.id === id)?.qty ?? 0, [lines]);
  const increment = useCallback((id: number) => {
    setLines((current) => addItem(current, id));
    vibrate(10);
  }, []);
  const decrement = useCallback((id: number) => {
    setLines((current) => setQuantity(current, id, (current.find((line) => line.id === id)?.qty ?? 0) - 1));
  }, []);
  const remove = useCallback((id: number) => setLines((current) => removeItem(current, id)), []);
  const clear = useCallback(() => setLines([]), []);

  const total = useMemo(() => basketTotal(lines, dishMap), [lines, dishMap]);
  const checkoutUrl = useMemo(() => {
    if (!telegramUsername || lines.length === 0) return null;
    return orderUrl(composeOrderMessage(lines, dishMap, templates, currency), telegramUsername);
  }, [telegramUsername, lines, dishMap, templates, currency]);

  const value: BasketContextValue = {
    lines,
    count,
    hydrated,
    dishes: dishMap,
    total,
    quantityOf,
    add,
    increment,
    decrement,
    remove,
    clear,
    isOpen,
    openBasket: () => setOpen(true),
    closeBasket: () => setOpen(false),
    bump,
    glow,
    checkoutUrl,
  };

  return (
    <BasketContext.Provider value={value}>
      {children}
      {flights.map((flight) => {
        const dx = flight.to.x - flight.from.x;
        const dy = flight.to.y - flight.from.y;
        const lift = Math.min(0, dy) - 90;
        // A seed, not a plain dot — it tumbles (several full turns) as it travels the arc.
        return (
          <motion.svg
            key={flight.key}
            aria-hidden="true"
            viewBox="0 0 10 13"
            className="pointer-events-none fixed z-[90] block h-4 w-3.5 text-accent-ink drop-shadow-[0_2px_6px_rgb(var(--anor)/0.45)]"
            style={{ left: flight.from.x - 7, top: flight.from.y - 8 }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{ x: [0, dx * 0.5, dx], y: [0, lift, dy], scale: [1, 1.15, 0.65], rotate: [0, 260, 560] }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], times: [0, 0.45, 1] }}
            onAnimationComplete={() => {
              pendingFlights.current = Math.max(0, pendingFlights.current - 1);
              setFlights((current) => current.filter((entry) => entry.key !== flight.key));
              setBump((bumpValue) => bumpValue + 1);
            }}
          >
            <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" fill="currentColor" />
          </motion.svg>
        );
      })}
    </BasketContext.Provider>
  );
}
