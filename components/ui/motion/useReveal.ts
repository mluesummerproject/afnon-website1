'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * One IntersectionObserver for the whole site. `.reveal`/`.reveal-heading`
 * are visible by default in CSS — this only ever *hides* an element first
 * (via `data-pending`) when a synchronous, pre-paint check has confirmed it
 * is genuinely below the viewport, then removes that attribute once it
 * scrolls into range so the CSS transition can play. An element already on
 * screen, or rendered before this module's JS runs at all, is never hidden —
 * so a race, a slow callback, or JS never executing can't leave real content
 * permanently invisible.
 */
let observer: IntersectionObserver | null = null;

function shared(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.removeAttribute('data-pending');
        entry.target.setAttribute('data-inview', 'true');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
  );
  return observer;
}

/** True only when the element's top edge is genuinely below the viewport (with the observer's own slack). */
function isBelowViewport(element: Element): boolean {
  if (typeof window === 'undefined') return false;
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  return rect.top > viewportHeight * 0.94;
}

/**
 * Imperative form, for elements that already have a ref of their own. Safe to
 * call more than once for the same element (e.g. from a callback ref that
 * re-fires on every render) — every call after the first is a no-op.
 */
export function observeReveal(element: Element | null): () => void {
  if (!element || element.hasAttribute('data-inview') || element.hasAttribute('data-pending')) return () => {};

  if (typeof IntersectionObserver === 'undefined' || typeof window === 'undefined') {
    element.setAttribute('data-inview', 'true');
    return () => {};
  }

  // Already on screen (or above it) — nothing to animate in, so just show it.
  if (!isBelowViewport(element)) {
    element.setAttribute('data-inview', 'true');
    return () => {};
  }

  element.setAttribute('data-pending', 'true');
  const io = shared();
  io.observe(element);
  return () => io.unobserve(element);
}

export function useReveal<T extends Element>(immediate = false) {
  const ref = useRef<T>(null);
  // Layout effect: runs synchronously after the DOM commits but before the
  // browser paints, so an element that needs `data-pending` never flashes
  // visible first.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (immediate) {
      element.setAttribute('data-inview', 'true');
      return;
    }
    return observeReveal(element);
  }, [immediate]);
  return ref;
}
