import { SectionHeading } from '@/components/site/SectionHeading';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { ResolvedSettings } from '@/lib/settings-core';

/**
 * Whatever the owner has written in Settings → About, per language — nothing
 * else. When a language is empty, this shows one neutral line rather than
 * disappearing or filling in marketing copy no one wrote.
 */
export function AboutSection({ locale, copy, settings }: { locale: Locale; copy: Dictionary['about']; settings: ResolvedSettings }) {
  const text = settings.about[locale];

  return (
    <section id="about" aria-labelledby="about-heading" className="shell scroll-mt-16 pt-10">
      <SectionHeading id="about-heading">{copy.heading}</SectionHeading>
      <div className="reveal mt-3 max-w-[42rem] rounded-[14px] bg-card p-4 shadow-card md:p-6">
        {text ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{text}</p> : <p className="text-[15px] text-ink/60">{copy.empty}</p>}
      </div>
    </section>
  );
}
