import 'server-only';

import { cookies } from 'next/headers';

import { defaultLocale, getDictionary, isLocale, LOCALE_COOKIE, type Dictionary, type Locale } from '@/lib/i18n';

/** The visitor's language, from their cookie. Uzbek when unset or unrecognised. */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleAndDictionary(): { locale: Locale; dict: Dictionary } {
  const locale = getLocale();
  return { locale, dict: getDictionary(locale) };
}
