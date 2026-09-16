'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { setLocale } from '@/app/actions/locale';
import { GlobeIcon } from '@/components/ui/icons';
import { format, localeMeta, locales, type Locale } from '@/lib/i18n';

/** Compact language button in the header; opens a small menu of the three languages. */
export function LanguageMenu({ locale, label, switchTo }: { locale: Locale; label: string; switchTo: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(locale);
  const [, startTransition] = useTransition();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setCurrent(locale), [locale]);

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(wrap.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    items().find((item) => item.getAttribute('aria-checked') === 'true')?.focus();

    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      const list = items();
      const index = list.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') event.preventDefault();
        setOpen(false);
        if (event.key === 'Escape') trigger.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        list[(index + 1) % list.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (code: Locale) => {
    setOpen(false);
    trigger.current?.focus();
    if (code === current) return;
    setCurrent(code);
    startTransition(() => setLocale(code));
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${localeMeta[current].name}`}
        onClick={() => setOpen((value) => !value)}
        className="tap flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-full px-2 text-[13px] font-bold text-ink hover:bg-fill"
      >
        <GlobeIcon size={16} className="text-ink/60" />
        {localeMeta[current].short}
      </button>
      {open ? (
        <ul role="menu" aria-label={label} className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-[14px] bg-card py-1 shadow-sheet ring-1 ring-line">
          {locales.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={code === current}
                aria-label={format(switchTo, { language: localeMeta[code].name })}
                lang={localeMeta[code].htmlLang}
                onClick={() => choose(code)}
                className="flex h-11 w-full items-center justify-between px-4 text-left text-[15px] text-ink hover:bg-fill focus-visible:bg-fill"
              >
                <span>{localeMeta[code].name}</span>
                {code === current ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
