import Link from 'next/link';

import { AnorMark } from '@/components/ui/AnorMark';
import { brand, contact, hours, location, nav, social } from '@/lib/site';

function Column({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="label border-t border-line-night pt-4 text-on-night-muted">{title}</h3>
      <div className="mt-4 space-y-1 text-body-sm text-on-night">{children}</div>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-night bg-night-soft pt-16 text-on-night md:pt-24">
      <div className="shell">
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-baseline gap-3" aria-label={`${brand.name} — home`}>
              <AnorMark className="h-7 w-auto self-center text-gold-soft" />
              <span className="font-display text-[2rem] leading-none tracking-tight">
                {brand.name}
              </span>
            </Link>
            <p className="mt-6 max-w-measure text-body-sm text-on-night-muted">{brand.tagline}.</p>
          </div>

          <Column title="Visit" className="md:col-span-3">
            <address className="not-italic">
              <p>{location.street}</p>
              <p className="text-on-night-muted">
                {location.city}, {location.country}
              </p>
            </address>
            <dl className="pt-2">
              {hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-4 py-1">
                  <dt className="text-on-night-muted">{entry.days}</dt>
                  <dd className="figures">{entry.time}</dd>
                </div>
              ))}
            </dl>
          </Column>

          <Column title="Reserve" className="md:col-span-3">
            <p>
              <a href={contact.telegram.href} target="_blank" rel="noreferrer noopener" className="link-underline inline-block py-1.5">
                Telegram {contact.telegram.display}
              </a>
            </p>
            <p>
              <a href={contact.whatsapp.href} target="_blank" rel="noreferrer noopener" className="link-underline inline-block py-1.5">
                {contact.whatsapp.display}
              </a>
            </p>
            <p>
              <a href={contact.phone.href} className="figures link-underline inline-block py-1.5">
                {contact.phone.display}
              </a>
            </p>
            <p>
              <a href={contact.email.href} className="link-underline inline-block py-1.5">
                {contact.email.display}
              </a>
            </p>
          </Column>

          <div className="md:col-span-2">
            <h3 className="label border-t border-line-night pt-4 text-on-night-muted">Browse</h3>
            <ul className="mt-4 space-y-1 text-body-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-underline inline-block py-1.5">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {social.length > 0 ? (
              <ul className="mt-5 space-y-1 text-body-sm text-on-night-muted">
                {social.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer noopener" className="link-underline inline-block py-1.5">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line-night py-8 text-micro text-on-night-muted sm:flex-row sm:items-center sm:justify-between md:mt-24">
          <p>
            © {year} {brand.name}. {brand.descriptor}
          </p>
          <Link href="/admin" className="link-underline w-fit">
            Staff
          </Link>
        </div>
      </div>
    </footer>
  );
}
