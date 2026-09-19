'use client';

import { useState, useTransition } from 'react';

import { setAdminLocale } from '@/app/actions/admin-locale';
import { useAdminLang } from '@/components/admin/AdminLangProvider';
import { format, localeMeta, locales, type Locale } from '@/lib/i18n';

/**
 * Three visible codes rather than a dropdown: staff switching the panel back
 * to a language they read should not have to open a menu written in one they
 * do not. Wide enough to tap on a phone, quiet enough to sit in the header.
 */
export function AdminLanguageSwitch() {
  const { locale, t } = useAdminLang();
  const [current, setCurrent] = useState<Locale>(locale);
  const [, startTransition] = useTransition();

  const choose = (code: Locale) => {
    if (code === current) return;
    setCurrent(code);
    startTransition(() => setAdminLocale(code));
  };

  return (
    <div role="group" aria-label={t.shell.language} className="flex shrink-0 rounded-hair border border-line-strong bg-surface p-0.5">
      {locales.map((code) => {
        const active = code === current;
        return (
          <button
            key={code}
            type="button"
            lang={localeMeta[code].htmlLang}
            aria-pressed={active}
            aria-label={format(t.shell.switchTo, { language: localeMeta[code].name })}
            onClick={() => choose(code)}
            className={`tap min-h-[2.25rem] min-w-[2.25rem] rounded-hair px-1.5 text-label font-medium uppercase transition-colors duration-quick ${
              active ? 'bg-anor text-paper' : 'text-ink-secondary hover:bg-anor-tint/60 hover:text-ink'
            }`}
          >
            {localeMeta[code].short}
          </button>
        );
      })}
    </div>
  );
}
