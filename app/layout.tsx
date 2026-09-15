import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Instrument_Serif } from 'next/font/google';

import { MotionProvider } from '@/components/ui/MotionProvider';
import { brand, siteUrl } from '@/lib/site';

import './globals.css';

/** Display: high-contrast editorial serif. Used for statements and dish names only. */
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

/** Text: a quiet humanist grotesque that stays legible at label sizes. */
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: ['Afnon', 'restaurant', 'Tashkent', 'Uzbek cuisine', 'Qatortol Street'],
  openGraph: {
    type: 'website',
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    url: '/',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FAF3E8',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
