import { SectionHeading } from '@/components/site/SectionHeading';
import {
  ClockIcon,
  DirectionsIcon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
  PinIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from '@/components/ui/icons';
import { format, type Dictionary } from '@/lib/i18n';
import type { ResolvedSettings, SocialKey } from '@/lib/settings-core';

const socialIcons: Record<SocialKey, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
};

/**
 * Single location, and the one card a guest opens when they mean to act:
 * come here, or reach us now. Everything below the address comes from the
 * Settings tab and each row is here only because a real value was saved —
 * a channel the restaurant has not given us renders nothing at all rather
 * than a dead button.
 */
export function VisitCard({ visit, settings }: { visit: Dictionary['visit']; settings: ResolvedSettings }) {
  const address = settings.address ?? `${visit.street}, ${visit.city}, ${visit.country}`;
  const hours = settings.workingHours ?? visit.hours;

  const channels = [
    settings.configured.phone && settings.phone
      ? { key: 'phone', label: visit.call, value: settings.phone.display, href: settings.phone.href, Icon: PhoneIcon, external: false }
      : null,
    settings.configured.telegram && settings.telegram
      ? { key: 'telegram', label: visit.telegram, value: settings.telegram.display, href: settings.telegram.href, Icon: TelegramIcon, external: true }
      : null,
    settings.configured.whatsapp && settings.whatsapp
      ? { key: 'whatsapp', label: visit.whatsapp, value: settings.whatsapp.display, href: settings.whatsapp.href, Icon: WhatsappIcon, external: true }
      : null,
  ].filter((channel): channel is NonNullable<typeof channel> => channel !== null);

  return (
    <section id="visit" aria-labelledby="visit-heading" className="shell scroll-mt-16 pt-10">
      <SectionHeading id="visit-heading">{visit.heading}</SectionHeading>
      <div className="reveal mt-3 rounded-[14px] bg-card p-4 shadow-card md:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/[0.08] px-3 py-1.5 text-[13px] font-semibold text-accent-ink">
          <span className="pulse-dot relative block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {visit.badge}
        </span>

        <div className="mt-4 flex items-start gap-3">
          <PinIcon size={20} className="mt-0.5 shrink-0 text-ink/60" />
          <div>
            <p className="text-[13px] text-ink/60">{visit.addressLabel}</p>
            <p className="text-[15px] font-medium leading-snug">{address}</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <ClockIcon size={20} className="mt-0.5 shrink-0 text-ink/60" />
          <div>
            <p className="text-[13px] text-ink/60">{visit.hoursLabel}</p>
            <p className="text-[15px] font-medium leading-snug">{hours}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={settings.mapUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="tap flex h-12 items-center justify-center gap-2 rounded-[14px] bg-accent px-7 text-button text-white"
          >
            <DirectionsIcon size={18} />
            {visit.directions}
          </a>

          {channels.map(({ key, label, value, href, Icon, external }) => (
            <a
              key={key}
              href={href}
              {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              aria-label={`${label}: ${value}`}
              className="tap flex h-12 items-center justify-center gap-2 rounded-[14px] border border-line px-5 text-button text-ink"
            >
              <Icon size={18} className="text-ink/60" />
              {label}
            </a>
          ))}
        </div>

        {settings.social.length > 0 ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[13px] text-ink/60">{visit.followUs}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {settings.social.map((entry) => {
                const Icon = socialIcons[entry.key];
                return (
                  <a
                    key={entry.key}
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={format(visit.onPlatform, { platform: entry.label })}
                    className="tap flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink/70 transition-colors hover:border-accent-ink hover:text-accent-ink"
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
