'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AnorMark } from '@/components/ui/AnorMark';
import { ease } from '@/lib/motion';
import { brand, contact, hero, nav } from '@/lib/site';

/**
 * The header stays quiet: it sits transparent over the hero photograph and only
 * takes on paper once the hero has been scrolled past.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Escape to close, Tab kept inside the panel, page frozen behind it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(
      () => panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus(),
      reduceMotion ? 0 : 220,
    );

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open, close, reduceMotion]);

  const onNight = !scrolled && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-base ease-brand ${
        scrolled || open ? 'border-b border-line bg-paper' : 'border-b border-transparent'
      } ${onNight ? 'on-night' : ''}`}
    >
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6 md:h-20">
        <Link
          href="/"
          aria-label={`${brand.name} — home`}
          className={`group flex items-baseline gap-3 transition-colors duration-base ease-brand ${
            onNight ? 'text-on-night' : 'text-ink'
          }`}
        >
          <AnorMark
            className={`h-6 w-auto self-center transition-colors duration-base ease-brand ${
              onNight ? 'text-gold-soft' : 'text-anor'
            }`}
          />
          <span className="font-display text-[1.6rem] leading-none tracking-tight">
            {brand.name}
          </span>
          <span
            className={`label hidden pl-1 lg:block ${
              onNight ? 'text-on-night-muted' : 'text-ink-muted'
            }`}
          >
            Tashkent
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`link-underline label transition-colors duration-base ease-brand ${
                onNight ? 'text-on-night hover:text-gold-soft' : 'text-ink hover:text-anor'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={hero.primaryCta.href}
            className={`rounded-hair border px-5 py-3 text-label font-medium uppercase transition-colors duration-base ease-brand ${
              onNight
                ? 'border-on-night/40 text-on-night hover:border-gold-soft hover:text-gold-soft'
                : 'border-anor bg-anor text-paper hover:bg-anor-deep'
            }`}
          >
            {hero.primaryCta.label}
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className={`-mr-2 flex h-12 min-w-[3rem] items-center gap-3 px-2 md:hidden ${
            open || !onNight ? 'text-ink' : 'text-on-night'
          }`}
        >
          <span className="label">{open ? 'Close' : 'Menu'}</span>
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span
              className={`absolute left-0 block h-px w-5 bg-current transition-transform duration-base ease-brand ${
                open ? 'top-1.5 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 block h-px bg-current transition-all duration-base ease-brand ${
                open ? 'top-1.5 w-5 -rotate-45' : 'top-3 w-3.5'
              }`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease }}
            className="fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto border-t border-line bg-paper md:hidden"
          >
            <nav aria-label="Primary (mobile)" className="shell flex flex-col pb-10 pt-4">
              {nav.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-baseline justify-between border-b border-line py-5 font-display text-display-md text-ink"
                >
                  <span>{item.label}</span>
                  <span className="label figures text-ink-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </Link>
              ))}

              <a
                href={hero.primaryCta.href}
                onClick={close}
                className="mt-8 flex items-center justify-center rounded-hair bg-anor px-6 py-5 text-label-lg font-medium uppercase text-paper"
              >
                {hero.primaryCta.label}
              </a>

              <a
                href={contact.phone.href}
                onClick={close}
                className="mt-3 flex items-center justify-center rounded-hair border border-line-strong px-6 py-5 text-label-lg font-medium uppercase text-ink"
              >
                Call the restaurant
              </a>

              <p className="label mt-10 text-ink-muted">{brand.descriptor}</p>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
