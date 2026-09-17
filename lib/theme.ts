/**
 * Classic (the AFNON look the site was designed in, and the default) and
 * Midnight. The whole theme is a single `data-theme` attribute on <html>;
 * every colour reads CSS custom properties that app/globals.css re-values
 * for Midnight, so there is no second palette anywhere in the components.
 *
 * The choice lives in a cookie so the server renders the right theme on the
 * very first paint — no flash of Classic before Midnight — and so the public
 * site and the staff panel share one preference.
 */
export const themes = ['classic', 'midnight'] as const;
export type Theme = (typeof themes)[number];
export const defaultTheme: Theme = 'classic';

export const THEME_COOKIE = 'afnon_theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The browser chrome colour (address bar on phones) for each theme — the page colour. */
export const themeColor: Record<Theme, string> = { classic: '#FAFAF8', midnight: '#171413' };

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (themes as readonly string[]).includes(value);
}
