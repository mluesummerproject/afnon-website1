import { jumpTarget } from '@/lib/scrollspy';

/** Sticky chrome heights (px) — kept in step with --header-h / --strip-h in globals.css. */
export const HEADER_HEIGHT = 56;
export const STRIP_HEIGHT = 52;
export const MENU_OFFSET = HEADER_HEIGHT + STRIP_HEIGHT;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToY(y: number): void {
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export function scrollToElement(element: Element, offset: number): void {
  scrollToY(jumpTarget(window.scrollY, element.getBoundingClientRect().top, offset));
}

/** Calls back once scrolling has been still for 120ms (or after `maxMs`). */
export function onScrollSettled(callback: () => void, maxMs = 1600): () => void {
  let idle = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener('scroll', onScroll);
    window.clearTimeout(idle);
    window.clearTimeout(cap);
    callback();
  };
  const onScroll = () => {
    window.clearTimeout(idle);
    idle = window.setTimeout(finish, 120);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  idle = window.setTimeout(finish, 180);
  const cap = window.setTimeout(finish, maxMs);
  return () => {
    done = true;
    window.removeEventListener('scroll', onScroll);
    window.clearTimeout(idle);
    window.clearTimeout(cap);
  };
}

export function vibrate(ms: number): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    /* unsupported — silently nothing */
  }
}
