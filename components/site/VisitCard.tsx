import { SectionHeading } from '@/components/site/SectionHeading';
import { ClockIcon, PinIcon } from '@/components/ui/icons';
import type { Dictionary } from '@/lib/i18n';
import type { ResolvedSettings } from '@/lib/settings-core';

/** Single location. Address and hours from Settings when the owner has filled them in. */
export function VisitCard({ visit, settings }: { visit: Dictionary['visit']; settings: ResolvedSettings }) {
  const address = settings.address ?? `${visit.street}, ${visit.city}, ${visit.country}`;
  const hours = settings.workingHours ?? visit.hours;

  return (
    <section id="visit" aria-labelledby="visit-heading" className="shell scroll-mt-16 pt-10">
      <SectionHeading id="visit-heading">{visit.heading}</SectionHeading>
      <div className="reveal mt-3 rounded-[14px] bg-card p-4 shadow-card md:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/[0.08] px-3 py-1.5 text-[13px] font-semibold text-accent">
          <span className="pulse-dot relative block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {visit.badge}
        </span>
        <div className="mt-4 flex items-start gap-3">
          <PinIcon size={20} className="mt-0.5 shrink-0 text-ink/60" />
          <p className="text-[15px] font-medium leading-snug">{address}</p>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <ClockIcon size={20} className="mt-0.5 shrink-0 text-ink/60" />
          <div>
            <p className="text-[13px] text-ink/60">{visit.hoursLabel}</p>
            <p className="text-[15px] font-medium leading-snug">{hours}</p>
          </div>
        </div>
        <a
          href={settings.mapUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="tap mt-5 flex h-12 items-center justify-center gap-2 rounded-[14px] bg-accent px-8 text-button text-white md:inline-flex"
        >
          <PinIcon size={18} />
          {visit.showOnMap}
        </a>
      </div>
    </section>
  );
}
