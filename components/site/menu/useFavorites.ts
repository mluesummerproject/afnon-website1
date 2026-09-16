'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { FAVORITES_STORAGE_KEY, parseFavorites } from '@/lib/favorites';

let cache: Set<number> | null = null;
const listeners = new Set<() => void>();

function read(): Set<number> {
  if (cache) return cache;
  try {
    cache = parseFavorites(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
  } catch {
    cache = new Set();
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** A favourite flag for one dish, stored only in this browser. */
export function useFavorite(id: number): [boolean, () => boolean] {
  const active = useSyncExternalStore(subscribe, () => read().has(id), () => false);

  const toggle = useCallback(() => {
    const next = new Set(read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    cache = next;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* storage unavailable — keeps working for this visit */
    }
    listeners.forEach((listener) => listener());
    return next.has(id);
  }, [id]);

  return [active, toggle];
}
