'use server';

import { cookies } from 'next/headers';

import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALE_COOKIE_MAX_AGE } from '@/lib/admin-i18n';
import { isLocale } from '@/lib/i18n';

/**
 * Stores the panel language for a year, in a cookie of its own so it never
 * moves with the language a member of staff picks while previewing the public
 * site. Writing it from a Server Action re-renders the page on the server in
 * the new language, without a reload.
 */
export async function setAdminLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;

  cookies().set(ADMIN_LOCALE_COOKIE, value, {
    path: '/',
    maxAge: ADMIN_LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
}
