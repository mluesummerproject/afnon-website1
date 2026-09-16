import 'server-only';

import { cookies } from 'next/headers';

import { ADMIN_LOCALE_COOKIE, getAdminDictionary, type AdminDictionary } from '@/lib/admin-i18n';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

/**
 * The language the panel speaks, from its own cookie. Uzbek until someone
 * changes it — the staff standing in the restaurant read Uzbek first, and the
 * panel should not arrive in a language they have to decode.
 */
export function getAdminLocale(): Locale {
  const value = cookies().get(ADMIN_LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export function getAdminDict(): AdminDictionary {
  return getAdminDictionary(getAdminLocale());
}

export function getAdminLocaleAndDict(): { locale: Locale; dict: AdminDictionary } {
  const locale = getAdminLocale();
  return { locale, dict: getAdminDictionary(locale) };
}
