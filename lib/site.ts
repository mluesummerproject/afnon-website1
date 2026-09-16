/**
 * ===========================================================================
 * AFNON — business facts and media. Language-neutral.
 * ===========================================================================
 * Everything a non-developer might need to change that is NOT prose lives
 * here: the name, the Telegram username, phone numbers, social links and the
 * map query. All wording — in Uzbek, Russian and English — lives in
 * lib/i18n.ts. Dish photos are managed in the staff panel.
 *
 * Contact channels and social links are managed in the staff Settings tab.
 *
 * Nothing here asserts an opening year, an award, a chef, a review or any
 * other claim that has not been supplied by the client.
 * ===========================================================================
 */

import type { SettingsFallback } from '@/lib/settings-core';

export const brand = {
  name: 'Afnon',
} as const;

/**
 * Built-in contact defaults. Deliberately EMPTY: the restaurant's real phone,
 * Telegram, WhatsApp and email are entered in the staff Settings tab, and the
 * public site shows nothing for a channel until it has a real value. Filling a
 * value in here instead also works (Settings still takes priority).
 */
export const contact = {
  telegramUsername: '',
  phone: { display: '', href: '' },
  whatsapp: { display: '', href: '' },
  email: { display: '', href: '' },
};

export const telegramProfileUrl = contact.telegramUsername ? `https://t.me/${contact.telegramUsername}` : '';

/** Social links shown when Settings has none. Empty until the restaurant supplies real accounts. */
export const social: { label: string; href: string }[] = [];

/** Address used for the map embed and directions link. No invented coordinates. */
export const mapQuery = 'Qatortol Street, Tashkent, Uzbekistan';

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afnon.example';

/**
 * Defaults used whenever a key is missing or empty in the staff Settings tab
 * (site_settings). Replace these placeholders, or simply fill in Settings.
 */
export const siteFallback: SettingsFallback = {
  phone: contact.phone.display,
  telegramUsername: contact.telegramUsername,
  whatsapp: contact.whatsapp.href,
  email: contact.email.display,
  mapUrl: directionsUrl,
  social,
};
