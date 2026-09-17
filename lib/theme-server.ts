import 'server-only';

import { cookies } from 'next/headers';

import { defaultTheme, isTheme, THEME_COOKIE, type Theme } from '@/lib/theme';

/** The visitor's theme, from their cookie. Classic when unset or unrecognised. */
export function getTheme(): Theme {
  const value = cookies().get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : defaultTheme;
}
