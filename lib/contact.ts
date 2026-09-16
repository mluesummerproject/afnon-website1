/**
 * Public contact form rules — pure, shared by the server action and tests.
 * Every submission is untrusted: only these three fields are ever read, and
 * each is normalized and bounded before anything touches the database.
 */

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  contact: { min: 3, max: 80 },
  message: { min: 5, max: 1000 },
} as const;

export type ContactField = keyof typeof CONTACT_LIMITS;
export type ContactValues = Record<ContactField, string>;

const CONTROLS_SINGLE_LINE = /[\x00-\x1f\x7f]/g;
const CONTROLS_MULTILINE = /[\x00-\x09\x0b-\x1f\x7f]/g; // keeps \x0a (newline)

/** Strips control characters (keeping newlines in the message) and collapses whitespace. */
function normalize(value: unknown, multiline: boolean): string {
  if (typeof value !== 'string') return '';
  if (!multiline) return value.replace(CONTROLS_SINGLE_LINE, ' ').replace(/\s+/g, ' ').trim();
  return value
    .replace(/\r\n?/g, '\x0a')
    .replace(CONTROLS_MULTILINE, ' ')
    .replace(/[^\S\x0a]+/g, ' ')
    .replace(/ *\x0a */g, '\x0a')
    .replace(/\x0a{3,}/g, '\x0a\x0a')
    .trim();
}

function countAlphanumerics(value: string): number {
  return (value.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

export function validateContact(raw: { name: unknown; contact: unknown; message: unknown }): {
  values: ContactValues;
  invalid: ContactField[];
} {
  const values: ContactValues = {
    name: normalize(raw.name, false),
    contact: normalize(raw.contact, false),
    message: normalize(raw.message, true),
  };

  const invalid: ContactField[] = [];
  const inRange = (field: ContactField) =>
    values[field].length >= CONTACT_LIMITS[field].min && values[field].length <= CONTACT_LIMITS[field].max;

  if (!inRange('name') || countAlphanumerics(values.name) < 2) invalid.push('name');
  // A phone number, a Telegram handle, an email — anything with enough substance to reply to.
  if (!inRange('contact') || countAlphanumerics(values.contact) < 3) invalid.push('contact');
  if (!inRange('message') || countAlphanumerics(values.message) < 3) invalid.push('message');

  return { values, invalid };
}

/** Turns a contact value into a tap-to-reply link for staff, where it is recognisable. */
export function replyLink(contact: string | null): { href: string; kind: 'phone' | 'telegram' | 'email' } | null {
  const value = contact?.trim() ?? '';
  if (!value) return null;

  const digits = value.replace(/[^\d+]/g, '');
  if (/^\+?\d{7,15}$/.test(digits) && /^[\d\s()+.-]+$/.test(value)) return { href: `tel:${digits}`, kind: 'phone' };

  const handle = value.match(/^(?:@|https?:\/\/t\.me\/)([a-z][a-z0-9_]{3,31})$/i);
  if (handle) return { href: `https://t.me/${handle[1]}`, kind: 'telegram' };

  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { href: `mailto:${value}`, kind: 'email' };
  return null;
}
