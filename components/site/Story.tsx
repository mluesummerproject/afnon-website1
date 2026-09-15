import { ArchFrame } from '@/components/ui/ArchFrame';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { images, story } from '@/lib/site';

/**
 * Asymmetric editorial spread: heading held left, narrative dropped down the
 * right, then a tall arched photograph against a small square detail. The
 * columns deliberately do not line up.
 */
export function Story() {
  const [opening, ...rest] = story.paragraphs;

  return (
    <section id="story" aria-labelledby="story-heading" className="bg-paper py-section-y">
      <div className="shell">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-12">
          <SectionHeading
            id="story-heading"
            index={story.index}
            kicker={story.kicker}
            heading={story.heading}
            className="md:col-span-5"
          />

          <div className="md:col-span-6 md:col-start-7 md:pt-20">
            <Reveal delay={0.05}>
              <p className="max-w-measure-wide text-lead text-ink-secondary">{opening}</p>
            </Reveal>
            {rest.map((paragraph, index) => (
              <Reveal key={paragraph} delay={0.1 + index * 0.05}>
                <p className="mt-6 max-w-measure-wide text-body text-ink-secondary">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-10 md:mt-28 md:grid-cols-12 md:gap-x-10">
          <Reveal className="md:col-span-7" distance={26}>
            <ArchFrame
              image={images.storyPrimary}
              ratio="aspect-[4/5] md:aspect-[5/6]"
              sizes="(min-width: 768px) 58vw, 100vw"
            />
          </Reveal>

          <div className="md:col-span-4 md:col-start-9 md:self-end md:pb-8">
            <Reveal delay={0.12}>
              <ArchFrame
                image={images.storyDetail}
                ratio="aspect-[4/5]"
                sizes="(min-width: 768px) 24vw, 60vw"
                square
                className="ml-auto w-1/2 md:w-4/5"
              />
            </Reveal>

            <Reveal delay={0.18}>
              <dl className="mt-10">
                {story.notes.map((note) => (
                  <div
                    key={note.label}
                    className="flex items-baseline justify-between gap-6 border-t border-line py-4"
                  >
                    <dt className="label text-ink-muted">{note.label}</dt>
                    <dd className="text-right text-micro text-ink">{note.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
