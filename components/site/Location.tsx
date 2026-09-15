import Image from 'next/image';

import { Action } from '@/components/ui/Action';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  directionsUrl,
  hours,
  hoursNote,
  images,
  location,
  locationSection,
  mapEmbedUrl,
} from '@/lib/site';

export function Location() {
  return (
    <section id="location" aria-labelledby="location-heading" className="scroll-mt-20 bg-paper">
      {/* Full-bleed band: carries the eye out of the dark gallery and back onto paper. */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-night-soft sm:aspect-[21/9]">
        <Image
          src={images.locationRoom.src}
          alt={images.locationRoom.alt}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: images.locationRoom.focus }}
        />
      </div>

      <div className="shell py-section-y">
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-5">
            <SectionHeading
              id="location-heading"
              index={locationSection.index}
              kicker={locationSection.kicker}
              heading={locationSection.heading}
            />

            <Reveal delay={0.05}>
              <address className="mt-8 not-italic">
                <p className="text-lead text-ink">{location.street}</p>
                <p className="mt-1 text-body text-ink-secondary">
                  {location.city}, {location.country}
                </p>
                <p className="mt-1 text-micro text-ink-muted">{location.addressLine}</p>
              </address>
            </Reveal>

            <Reveal delay={0.1}>
              <Action href={directionsUrl} variant="quiet" withArrow className="mt-7">
                Get directions
              </Action>
              <p className="label mt-3 text-ink-muted">{location.directionsNote}</p>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <Reveal>
              <h3 className="label border-t border-line-strong pt-4 text-ink-muted">Hours</h3>
              <dl className="mt-2">
                {hours.map((entry) => (
                  <div
                    key={entry.days}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-4"
                  >
                    <dt className="text-body text-ink">{entry.days}</dt>
                    <dd className="figures text-body text-ink-secondary">{entry.time}</dd>
                  </div>
                ))}
              </dl>
              {hoursNote ? <p className="mt-4 text-micro text-ink-muted">{hoursNote}</p> : null}
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative mt-10 aspect-[4/3] w-full overflow-hidden border border-line bg-paper-alt sm:aspect-[16/10]">
                {/* Shown until — or instead of — the embed, so the panel is never blank. */}
                <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
                  <p className="label text-ink-muted">Map</p>
                  <p className="mt-2 font-display text-display-sm text-ink">{location.street}</p>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline label mt-3 text-anor"
                  >
                    Open in Google Maps
                  </a>
                </div>

                <iframe
                  title={`Map showing ${location.street}, ${location.city}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.35] contrast-[1.05]"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
