import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';

import { MotionProvider } from '@/components/ui/MotionProvider';
import { localeMeta, locales } from '@/lib/i18n';
import { getLocaleAndDictionary } from '@/lib/locale';
import { brand, siteUrl } from '@/lib/site';

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

export function generateMetadata(): Metadata {
  const { locale, dict } = getLocaleAndDictionary();
  return {
    metadataBase: new URL(siteUrl),
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
    },
    twitter: { card: 'summary_large_image', title: dict.meta.title, description: dict.meta.description },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#FAFAF8',
  colorScheme: 'light',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = getLocaleAndDictionary();
  return (
    <html lang={localeMeta[locale].htmlLang} className={`${sans.variable} ${wordmark.variable}`}>
      <body>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: '.reveal,.reveal-heading{opacity:1!important;transform:none!important}.dish-img{opacity:1!important}' }} />
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
