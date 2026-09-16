import { SectionHeading } from '@/components/site/SectionHeading';
import { PhoneIcon, TelegramIcon } from '@/components/ui/icons';
import type { Dictionary } from '@/lib/i18n';
import type { ResolvedSettings } from '@/lib/settings-core';

/**
 * The plain facts: whichever contact channels the owner has actually saved
 * in Settings. Always present as a section — when nothing is configured yet
 * it says so, rather than disappearing (the interactive "send a message"
 * form lives in the floating contact bubble, not here).
 */
export function ContactInfoSection({ copy, settings }: { copy: Dictionary['contactSection']; settings: ResolvedSettings }) {
  const rows = [
    settings.phone ? { key: 'phone', label: copy.phone, value: settings.phone.display, href: settings.phone.href, Icon: PhoneIcon } : null,
    settings.telegram
      ? { key: 'telegram', label: copy.telegram, value: settings.telegram.display, href: settings.telegram.href, Icon: TelegramIcon }
      : null,
    settings.whatsapp
      ? { key: 'whatsapp', label: copy.whatsapp, value: settings.whatsapp.display, href: settings.whatsapp.href, Icon: PhoneIcon }
      : null,
    settings.email ? { key: 'email', label: copy.email, value: settings.email.display, href: settings.email.href, Icon: TelegramIcon } : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  const hasContent = rows.length > 0 || settings.social.length > 0;

  return (
    <section id="contact" aria-labelledby="contact-heading" className="shell scroll-mt-16 pt-10">
      <SectionHeading id="contact-heading">{copy.heading}</SectionHeading>
      <div className="reveal mt-3 max-w-[32rem] rounded-[14px] bg-card p-4 shadow-card md:p-6">
        {!hasContent ? (
          <p className="text-[15px] text-ink/60">{copy.empty}</p>
        ) : (
          <div className="space-y-4">
            {rows.map(({ key, label, value, href, Icon }) => (
              <a key={key} href={href} target={key === 'email' ? undefined : '_blank'} rel="noreferrer noopener" className="tap flex items-start gap-3">
                <Icon size={20} className="mt-0.5 shrink-0 text-ink/60" />
                <span>
                  <span className="block text-[13px] text-ink/60">{label}</span>
                  <span className="block text-[15px] font-medium leading-snug text-ink">{value}</span>
                </span>
              </a>
            ))}
            {settings.social.length > 0 ? (
              <div className="border-t border-line pt-4">
                <p className="text-[13px] text-ink/60">{copy.social}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.social.map((entry) => (
                    <a
                      key={entry.href}
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="tap rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink"
                    >
                      {entry.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
