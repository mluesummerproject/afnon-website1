'use server';

import { cookies } from 'next/headers';

import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/lib/i18n';

/**
 * Stores the chosen language for a year. Writing a cookie from a Server
 * Action makes Next re-render the current page on the server in the new
 * language, without a full reload and without losing scroll position.
 */
export async function setLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;

  cookies().set(LOCALE_COOKIE, value, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // Not httpOnly on purpose: it holds no secret, and leaving it readable
    // keeps the door open for client-side language detection later.
    httpOnly: false,
  });
}
