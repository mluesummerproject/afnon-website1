import type { Metadata } from 'next';
import Link from 'next/link';

import { LanguageMenu } from '@/components/site/LanguageMenu';
import { AnorMark } from '@/components/ui/AnorMark';
import { getLocaleAndDictionary } from '@/lib/locale';
import { getSiteSettings } from '@/lib/settings';
import { brand } from '@/lib/site';

export function generateMetadata(): Metadata {
  const { dict } = getLocaleAndDictionary();
  return { title: dict.privacyPage.title, description: dict.privacyPage.lead, alternates: { canonical: '/maxfiylik' } };
}

/**
 * The privacy policy — plain language, in the visitor's language, saying only
 * what the site actually does. The contact details are the restaurant's own,
 * read from site_settings (never hardcoded), so a change in Settings changes
 * this page too.
 */
export default async function PrivacyPage() {
  const { locale, dict } = getLocaleAndDictionary();
  const copy = dict.privacyPage;
  const settings = await getSiteSettings();

  const channels = [
    settings.phone ? { label: settings.phone.display, href: settings.phone.href } : null,
    settings.telegram ? { label: `Telegram ${settings.telegram.display}`, href: settings.telegram.href, external: true } : null,
    settings.whatsapp ? { label: `WhatsApp ${settings.whatsapp.display}`, href: settings.whatsapp.href, external: true } : null,
    settings.email ? { label: settings.email.display, href: settings.email.href } : null,
  ].filter(Boolean) as { label: string; href: string; external?: boolean }[];

  const heading = 'text-section text-ink';
  const body = 'mt-2 text-[15px] leading-relaxed text-ink/75';
  const list = 'mt-3 space-y-2.5';
  const item = 'flex gap-3 text-[15px] leading-relaxed text-ink/75';
  const dot = <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />;

  return (
    <div className="min-h-[100svh] bg-page">
      <header className="border-b border-line bg-page">
        <div className="shell flex h-14 items-center justify-between">
          <Link href="/" className="flex h-11 items-center gap-2" aria-label={dict.a11y.home.replace('{brand}', brand.name)}>
            <AnorMark className="h-6 w-auto text-accent" />
            <span className="font-wordmark text-[26px] leading-none text-ink">{brand.name}</span>
          </Link>
          <LanguageMenu locale={locale} label={dict.a11y.language} switchTo={dict.a11y.switchTo} />
        </div>
      </header>

      <main className="shell max-w-[44rem] animate-fade-rise py-10 md:py-14">
        <h1 className="text-[28px] font-bold leading-tight text-ink md:text-[34px]">{copy.title}</h1>
        <span aria-hidden="true" className="mt-3 block h-[2px] w-10 bg-accent" />
        <p className="mt-5 text-[17px] leading-relaxed text-ink/80">{copy.lead}</p>

        <div className="mt-10 space-y-9">
          <section aria-labelledby="p-collect">
            <h2 id="p-collect" className={heading}>{copy.collectHeading}</h2>
            <ul className={list}>
              {copy.collect.map((line) => (
                <li key={line} className={item}>{dot}<span>{line}</span></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="p-why">
            <h2 id="p-why" className={heading}>{copy.whyHeading}</h2>
            <p className={body}>{copy.why}</p>
          </section>

          <section aria-labelledby="p-anon" className="rounded-[14px] border border-accent/20 bg-accent/[0.04] px-5 py-4">
            <h2 id="p-anon" className={heading}>{copy.anonymousHeading}</h2>
            <p className={body}>{copy.anonymous}</p>
          </section>

          <section aria-labelledby="p-share">
            <h2 id="p-share" className={heading}>{copy.sharingHeading}</h2>
            <p className={body}>{copy.sharing}</p>
          </section>

          <section aria-labelledby="p-store">
            <h2 id="p-store" className={heading}>{copy.storageHeading}</h2>
            <ul className={list}>
              {copy.storage.map((line) => (
                <li key={line} className={item}>{dot}<span>{line}</span></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="p-keep">
            <h2 id="p-keep" className={heading}>{copy.retentionHeading}</h2>
            <p className={body}>{copy.retention}</p>
          </section>

          <section aria-labelledby="p-rights">
            <h2 id="p-rights" className={heading}>{copy.rightsHeading}</h2>
            <p className={body}>{copy.rights}</p>
          </section>

          <section aria-labelledby="p-contact" className="rounded-[14px] bg-card p-5 shadow-card">
            <h2 id="p-contact" className={heading}>{copy.contactHeading}</h2>
            {channels.length > 0 || settings.address ? (
              <>
                <p className={body}>{copy.contact}</p>
                <ul className="mt-2">
                  {channels.map((channel) => (
                    <li key={channel.href}>
                      <a
                        href={channel.href}
                        className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-accent underline-offset-4 hover:underline"
                        {...(channel.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      >
                        {channel.label}
                      </a>
                    </li>
                  ))}
                  {settings.address ? <li className="flex min-h-[44px] items-center text-[15px] text-ink/75">{settings.address}</li> : null}
                </ul>
              </>
            ) : (
              <p className={body}>{copy.noContact}</p>
            )}
          </section>
        </div>

        <Link href="/" className="tap mt-10 inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-6 text-button text-white">
          {copy.back}
        </Link>
      </main>
    </div>
  );
}
