import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { headers } from 'next/headers';

import { MotionProvider } from '@/components/ui/MotionProvider';
import { localeMeta, locales } from '@/lib/i18n';
import { getLocaleAndDictionary } from '@/lib/locale';
import { brand, siteUrl } from '@/lib/site';
import { themeColor } from '@/lib/theme';
import { getTheme } from '@/lib/theme-server';

import './globals.css';

/** One family for every word of UI in Uzbek (incl. ʻ), Russian and English. */
const sans = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
});

/** The serif survives in exactly one place: the Afnon wordmark. */
const wordmark = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-wordmark',
});

/**
 * The address this request actually arrived on — afnonuz.com, the Netlify
 * domain or a preview — so og:url, the canonical link and the absolute
 * og:image URL always point at a site that exists. NEXT_PUBLIC_SITE_URL, when
 * set, wins (e.g. to make every domain declare afnonuz.com as canonical).
 * Safe to derive per request: the page is served private, no-store, so one
 * host's tags are never cached and handed to another.
 */
function requestOrigin(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  const list = headers();
  const host = list.get('x-forwarded-host')?.split(',')[0]?.trim() || list.get('host');
  if (host && /^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) {
    const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
    return new URL(`${local ? 'http' : 'https'}://${host}`);
  }
  return new URL(siteUrl);
}

/** 1200×630, built from the Afnon mark over a real dish photo (the restaurant's own osh). */
const SHARE_IMAGE = { url: '/og-image.jpg', width: 1200, height: 630, type: 'image/jpeg' } as const;

export function generateMetadata(): Metadata {
  const { locale, dict } = getLocaleAndDictionary();
  const image = { ...SHARE_IMAGE, alt: dict.meta.imageAlt };
  return {
    metadataBase: requestOrigin(),
    title: { default: dict.meta.title, template: `%s — ${brand.name}` },
    description: dict.meta.description,
    applicationName: brand.name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: brand.name,
      title: dict.meta.title,
      description: dict.meta.description,
      url: '/',
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((other) => other !== locale).map((other) => localeMeta[other].ogLocale),
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: dict.meta.title, description: dict.meta.description, images: [image] },
    robots: { index: true, follow: true },
  };
}

/** Browser chrome follows the chosen theme, so a phone's address bar matches the page. */
export function generateViewport(): Viewport {
  const theme = getTheme();
  return {
    themeColor: themeColor[theme],
    colorScheme: theme === 'midnight' ? 'dark' : 'light',
    viewportFit: 'cover',
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = getLocaleAndDictionary();
  return (
    <html lang={localeMeta[locale].htmlLang} data-theme={getTheme()} className={`${sans.variable} ${wordmark.variable}`}>
      <body>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: '.reveal,.reveal-heading{opacity:1!important;transform:none!important}.dish-img{opacity:1!important}' }} />
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
