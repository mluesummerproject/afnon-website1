import { contact } from '@/lib/site';

/**
 * Strict RFC 3986 component encoding. `encodeURIComponent` leaves ! ' ( ) *
 * untouched; dish names such as "Chef's plov" must not produce a link whose
 * query text ends early in any client that is less forgiving than a browser.
 */
export function encodeComponentStrict(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Accepts "afnon", "@afnon" or "https://t.me/afnon" and returns "afnon". */
export function normalizeTelegramUsername(username: string): string {
  return username
    .trim()
    .replace(/^https?:\/\/(www\.)?t\.me\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
}

/** https://t.me/<username>?text=<encoded message> */
export function telegramMessageUrl(message: string, username: string = contact.telegramUsername): string {
  const handle = normalizeTelegramUsername(username);
  return `https://t.me/${encodeComponentStrict(handle)}?text=${encodeComponentStrict(message)}`;
}

/** Fills the `{dish}` slot of a localized order template. */
export function orderMessage(template: string, dish: string): string {
  return template.replace('{dish}', dish.trim());
}
