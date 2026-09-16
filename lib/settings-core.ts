/** Editable business info — validation and fallback, pure. */

export const SETTING_KEYS = [
  'phone',
  'telegram_username',
  'whatsapp',
  'email',
  'address',
  'working_hours',
  'map_link',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'about_uz',
  'about_ru',
  'about_en',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type StoredSettings = Partial<Record<SettingKey, string>>;
export type ContactLink = { display: string; href: string };

export type SocialKey = 'instagram' | 'facebook' | 'tiktok' | 'youtube';

/** A saved social account. `key` lets the UI pick the right icon. */
export type SocialLink = { key: SocialKey; label: string; href: string };

export type SettingsFallback = {
  phone: string;
  telegramUsername: string;
  whatsapp: string;
  email: string;
  mapUrl: string;
  social: SocialLink[];
};

export type ResolvedSettings = {
  phone: ContactLink | null;
  telegram: ContactLink | null;
  telegramUsername: string | null;
  whatsapp: ContactLink | null;
  email: ContactLink | null;
  /** null → show the translated default address from the dictionary */
  address: string | null;
  /** null → show the translated default hours from the dictionary */
  workingHours: string | null;
  mapUrl: string;
  social: SocialLink[];
  /** Whether the owner actually saved each channel (placeholders don't count). */
  configured: { phone: boolean; telegram: boolean; whatsapp: boolean; email: boolean };
  /** Raw "About us" text per language, exactly as the owner wrote it — null when never filled in. No fallback text is ever synthesized here. */
  about: { uz: string | null; ru: string | null; en: string | null };
};

const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export function isSettingKey(value: unknown): value is SettingKey {
  return typeof value === 'string' && (SETTING_KEYS as readonly string[]).includes(value);
}

/** Known keys with a non-empty value; everything else is ignored. */
export function rowsToStored(rows: { key: unknown; value: unknown }[]): StoredSettings {
  const stored: StoredSettings = {};
  for (const row of rows ?? []) {
    if (!isSettingKey(row?.key) || typeof row.value !== 'string') continue;
    const value = row.value.trim();
    if (value) stored[row.key] = value;
  }
  return stored;
}

const digits = (value: string) => value.replace(/\D/g, '');

export function normalizeTelegram(raw: string): string {
  return raw.trim().replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
}

/** Validates one field as typed in the Settings tab. Empty is valid and means "use the default". */
export function validateSetting(key: SettingKey, raw: string): { value: string | null; error?: string } {
  const value = (raw ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim();
  if (!value) return { value: null };

  switch (key) {
    case 'phone':
      if (!/^[+\d\s().-]+$/.test(value) || digits(value).length < 7 || digits(value).length > 15) {
        return { value: null, error: 'Phone numbers need 7–15 digits (spaces, +, - and brackets are fine).' };
      }
      return { value };
    case 'telegram_username': {
      const handle = normalizeTelegram(value);
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(handle)) {
        return { value: null, error: 'Telegram usernames are 5–32 letters, digits or underscores and start with a letter (no @ needed).' };
      }
      return { value: handle };
    }
    case 'whatsapp': {
      const number = digits(value.replace(/^https?:\/\/(www\.)?wa\.me\//i, ''));
      if (number.length < 7 || number.length > 15) {
        return { value: null, error: 'WhatsApp needs the full number with country code, e.g. 998901234567.' };
      }
      return { value: number };
    }
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 120) {
        return { value: null, error: 'That email address does not look right.' };
      }
      return { value };
    case 'address':
    case 'working_hours':
      if (value.length > 200) return { value: null, error: 'Keep this under 200 characters.' };
      return { value };
    case 'about_uz':
    case 'about_ru':
    case 'about_en':
      if (value.length > 4000) return { value: null, error: 'Keep this under 4,000 characters.' };
      return { value };
    default: {
      // map_link and social links
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || value.length > 500) throw new Error('bad');
        return { value };
      } catch {
        return { value: null, error: 'This must be a full link starting with https://' };
      }
    }
  }
}

export function phoneLink(value: string): ContactLink {
  const numbers = digits(value);
  return { display: value, href: `tel:+${numbers}` };
}

export function whatsappLink(value: string): ContactLink {
  const numbers = digits(value);
  return { display: `+${numbers}`, href: `https://wa.me/${numbers}` };
}

export function telegramLink(username: string): ContactLink {
  const handle = normalizeTelegram(username);
  return { display: `@${handle}`, href: `https://t.me/${handle}` };
}

/** Stored value first, the lib/site.ts default whenever a key is missing or empty. */
export function resolveSettings(stored: StoredSettings, fallback: SettingsFallback): ResolvedSettings {
  const phone = stored.phone ?? fallback.phone;
  const telegram = stored.telegram_username ?? fallback.telegramUsername;
  const whatsapp = stored.whatsapp ?? fallback.whatsapp;
  const email = stored.email ?? fallback.email;

  const storedSocial = (Object.keys(SOCIAL_LABELS) as SocialKey[])
    .filter((key) => stored[key])
    .map((key) => ({ key, label: SOCIAL_LABELS[key], href: stored[key] as string }));

  return {
    phone: phone ? phoneLink(phone) : null,
    telegram: telegram ? telegramLink(telegram) : null,
    telegramUsername: telegram ? normalizeTelegram(telegram) : null,
    whatsapp: whatsapp ? whatsappLink(whatsapp) : null,
    email: email ? { display: email, href: `mailto:${email}` } : null,
    address: stored.address ?? null,
    workingHours: stored.working_hours ?? null,
    mapUrl: stored.map_link ?? fallback.mapUrl,
    social: storedSocial.length > 0 ? storedSocial : fallback.social,
    configured: {
      phone: Boolean(stored.phone),
      telegram: Boolean(stored.telegram_username),
      whatsapp: Boolean(stored.whatsapp),
      email: Boolean(stored.email),
    },
    about: { uz: stored.about_uz ?? null, ru: stored.about_ru ?? null, en: stored.about_en ?? null },
  };
}
