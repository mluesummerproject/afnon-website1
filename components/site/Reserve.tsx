import { Action } from '@/components/ui/Action';
import { AnorMark } from '@/components/ui/AnorMark';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { contact, reserveSection } from '@/lib/site';

/** The three ways to reach the restaurant, in the order a guest in Tashkent would try them. */
const channels = [
  { label: 'Telegram', ...contact.telegram, note: 'Fastest reply' },
  { label: 'WhatsApp', ...contact.whatsapp, note: 'Message or call' },
  { label: 'Telephone', ...contact.phone, note: 'During opening hours' },
];

/**
 * The only section where the brand red owns the entire field — which is what
 * makes it read as the primary action without a single extra effect.
 */
export function Reserve() {
  return (
    <section
      id="reserve"
      aria-labelledby="reserve-heading"
      className="on-night relative scroll-mt-20 overflow-hidden bg-anor py-section-y text-paper"
    >
      <AnorMark
        outline
        className="pointer-events-none absolute -bottom-32 -right-24 h-[30rem] w-auto text-paper/[0.09] md:h-[44rem]"
      />

      <div className="shell relative grid gap-12 md:grid-cols-12 md:gap-x-12">
        <div className="md:col-span-5">
          <SectionHeading
            id="reserve-heading"
            index={reserveSection.index}
            kicker={reserveSection.kicker}
            heading={reserveSection.heading}
            tone="anor"
          />

          <Reveal delay={0.05}>
            <p className="mt-7 max-w-measure text-lead text-paper/80">{reserveSection.lead}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <Action href={contact.telegram.href} variant="solid-paper" className="mt-9">
              Reserve on Telegram
            </Action>
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7 md:pt-4">
          <Reveal delay={0.08}>
            <ul>
              {channels.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    {...(channel.href.startsWith('http')
                      ? { target: '_blank', rel: 'noreferrer noopener' }
                      : {})}
                    className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-paper/25 py-6 transition-colors duration-base ease-brand hover:text-gold-soft md:py-7"
                  >
                    <span className="label text-paper/70 transition-colors duration-base ease-brand group-hover:text-gold-soft">
                      {channel.label}
                    </span>
                    <span className="font-display text-display-sm">{channel.display}</span>
                    <span className="label w-full text-paper/50">{channel.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
