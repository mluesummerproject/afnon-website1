'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ContactForm } from '@/components/site/ContactForm';
import { ArrowUpIcon, ChatIcon, ChevronIcon, CloseIcon, MessageIcon, PhoneIcon, TelegramIcon } from '@/components/ui/icons';
import { scrollToY } from '@/lib/client-scroll';
import type { Dictionary } from '@/lib/i18n';

const ABOVE_NAV = 'bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+16px)] md:bottom-6';

/** Bottom-left, after 600px of scroll — the opposite corner from the contact button. */
export function ScrollTopButton({ label }: { label: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => scrollToY(0)}
      aria-label={label}
      aria-hidden={!shown || undefined}
      tabIndex={shown ? 0 : -1}
      className={`tap fixed left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-card ring-1 ring-line transition-[opacity,transform] duration-200 md:left-6 ${ABOVE_NAV} ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon size={20} />
    </button>
  );
}

type Option = { key: string; label: string; Icon: typeof ChatIcon; href?: string; external?: boolean; onSelect?: () => void };

/**
 * Circular contact button, bottom-right above the bottom nav. Expands upward
 * into labelled options with a spring; dimmed backdrop; Escape or backdrop tap
 * closes; focus stays inside while open. A channel the restaurant has not
 * filled in (Settings) is simply not offered.
 */
export function ContactFab({
  labels,
  contactCopy,
  token,
  telegramHref,
  phoneHref,
}: {
  labels: Dictionary['fab'];
  contactCopy: Dictionary['contact'];
  token: string;
  telegramHref: string | null;
  phoneHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'options' | 'message'>('options');
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => setPanel('options'), 200);
  }, []);

  const options: Option[] = [
    ...(telegramHref ? [{ key: 'telegram', label: labels.telegram, Icon: TelegramIcon, href: telegramHref, external: true }] : []),
    ...(phoneHref ? [{ key: 'call', label: labels.call, Icon: PhoneIcon, href: phoneHref }] : []),
    { key: 'message', label: labels.message, Icon: MessageIcon, onSelect: () => setPanel('message') },
  ];

  useEffect(() => {
    if (!open) return;
    const focusables = () => Array.from(wrap.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea') ?? []);
    window.setTimeout(() => focusables()[0]?.focus(), reduce ? 0 : 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        toggle.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, reduce, close]);

  const item = reduce
    ? { open: { opacity: 1 }, closed: { opacity: 0 } }
    : {
        open: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 520, damping: 30 } },
        closed: { opacity: 0, y: 14, scale: 0.9, transition: { duration: 0.12 } },
      };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="fab-backdrop"
            aria-hidden="true"
            className="fixed inset-0 z-[44] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={close}
          />
        ) : null}
      </AnimatePresence>

      <div ref={wrap} className={`fixed right-4 z-[45] flex flex-col items-end gap-3 md:right-6 ${ABOVE_NAV}`}>
        <AnimatePresence mode="wait">
          {open && panel === 'options' ? (
            <motion.ul
              key="options"
              id="contact-fab-panel"
              className="flex flex-col items-end gap-2.5"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{ open: { transition: { staggerChildren: reduce ? 0 : 0.045, staggerDirection: -1 } }, closed: {} }}
            >
              {options.map(({ key, label, Icon, href, external, onSelect }) => {
                const inner = (
                  <>
                    <span>{label}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Icon size={20} />
                    </span>
                  </>
                );
                const className = 'tap flex h-12 items-center gap-3 rounded-full bg-card pl-4 pr-1.5 text-[15px] font-semibold text-ink shadow-sheet';
                return (
                  <motion.li key={key} variants={item}>
                    {href ? (
                      <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})} onClick={close} className={className}>
                        {inner}
                      </a>
                    ) : (
                      <button type="button" onClick={onSelect} className={className}>
                        {inner}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : open && panel === 'message' ? (
            <motion.div
              key="message"
              id="contact-fab-panel"
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-[336px] max-w-[86vw] rounded-[20px] bg-card p-4 shadow-sheet"
            >
              <div className="mb-3 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPanel('options')}
                  aria-label={labels.back}
                  className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-fill"
                >
                  <ChevronIcon direction="left" size={18} />
                </button>
                <p className="truncate text-[15px] font-semibold text-ink">{contactCopy.heading}</p>
              </div>
              <ContactForm token={token} copy={contactCopy} callHref={phoneHref} callLabel={labels.call} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls="contact-fab-panel"
          aria-label={open ? labels.close : labels.open}
          onClick={() => (open ? close() : setOpen(true))}
          className="tap flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(92,18,30,0.35)]"
        >
          <motion.span
            key={open ? 'close' : 'chat'}
            initial={reduce ? false : { rotate: -60, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 28 }}
          >
            {open ? <CloseIcon size={22} /> : <ChatIcon size={24} />}
          </motion.span>
        </button>
      </div>
    </>
  );
}
