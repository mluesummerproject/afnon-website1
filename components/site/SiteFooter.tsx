import Link from 'next/link';

import { AnorMark } from '@/components/ui/AnorMark';
import type { Dictionary } from '@/lib/i18n';
import type { ResolvedSettings } from '@/lib/settings-core';
import { brand } from '@/lib/site';

/** Compact footer: only the channels and accounts the restaurant has actually filled in. */
export function SiteFooter({ dict, settings }: { dict: Dictionary; settings: ResolvedSettings }) {
  const year = new Date().getFullYear();
  const channels = [
    settings.phone ? { label: settings.phone.display, href: settings.phone.href } : null,
    settings.telegram ? { label: `Telegram ${settings.telegram.display}`, href: settings.telegram.href, external: true } : null,
    settings.whatsapp ? { label: `WhatsApp ${settings.whatsapp.display}`, href: settings.whatsapp.href, external: true } : null,
    settings.email ? { label: settings.email.display, href: settings.email.href } : null,
  ].filter(Boolean) as { label: string; href: string; external?: boolean }[];

  const link = 'inline-flex min-h-[44px] items-center text-[14px] text-ink hover:text-accent';

  return (
    <footer className="mt-12 border-t border-line bg-card pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+88px)] pt-8 md:pb-10">
      <div className="shell grid gap-6 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2">
            <AnorMark className="h-6 w-auto text-accent" />
            <span className="font-wordmark text-[26px] leading-none">{brand.name}</span>
          </p>
          <p className="mt-2 text-[13px] text-ink/60">{dict.brand.descriptor}</p>
        </div>

        {channels.length > 0 ? (
          <div>
            <h2 className="text-[13px] font-semibold text-ink/60">{dict.footer.contact}</h2>
            <ul className="mt-1">
              {channels.map((channel) => (
                <li key={channel.href}>
                  <a href={channel.href} className={link} {...(channel.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          {settings.social.length > 0 ? (
            <ul>
              {settings.social.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noreferrer noopener" className={link}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/admin" className={`${link} text-ink/60`}>
            {dict.footer.staff}
          </Link>
        </div>
      </div>
      <p className="shell mt-4 text-[12px] text-ink/60">
        © {year} {brand.name}
      </p>
    </footer>
  );
}
