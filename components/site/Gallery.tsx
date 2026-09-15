import Image from 'next/image';

import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { gallery, gallerySection, type ImageAsset } from '@/lib/site';

function Plate({
  image,
  ratio,
  sizes,
  className = '',
  delay = 0,
}: {
  image: ImageAsset;
  ratio: string;
  sizes: string;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal className={className} delay={delay} distance={24}>
      <figure className="group">
        <div className={`relative ${ratio} overflow-hidden bg-night-soft`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-slow ease-brand motion-safe:group-hover:scale-[1.035]"
            style={{ objectPosition: image.focus ?? '50% 50%' }}
          />
        </div>
        {image.caption ? (
          <figcaption className="label mt-4 text-on-night-muted">{image.caption}</figcaption>
        ) : null}
      </figure>
    </Reveal>
  );
}

/**
 * A photography story rather than a grid: one dominant frame, then two
 * movements that step across the page at different weights and never repeat a
 * ratio side by side.
 */
export function Gallery() {
  const [dominant, ...rest] = gallery;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="on-night scroll-mt-20 bg-night py-section-y"
    >
      <div className="shell">
        <SectionHeading
          id="gallery-heading"
          index={gallerySection.index}
          kicker={gallerySection.kicker}
          heading={gallerySection.heading}
          tone="night"
          className="max-w-measure-wide"
        />

        {/* Movement one — the dominant frame, answered by a tall offcut. */}
        <div className="mt-14 grid grid-cols-12 gap-x-4 md:mt-24 md:gap-x-8">
          {dominant ? (
            <Plate
              image={dominant}
              ratio="aspect-[4/3] md:aspect-[16/10]"
              sizes="(min-width: 768px) 72vw, 100vw"
              className="col-span-12 md:col-span-9"
            />
          ) : null}
          {rest[0] ? (
            <Plate
              image={rest[0]}
              ratio="aspect-[3/4]"
              sizes="(min-width: 768px) 20vw, 50vw"
              className="col-span-6 col-start-7 mt-8 md:col-span-2 md:col-start-11 md:mt-28"
              delay={0.1}
            />
          ) : null}
        </div>

        {/* Movement two — weight shifts left, air opens on the right. */}
        <div className="mt-16 grid grid-cols-12 gap-x-4 md:mt-28 md:gap-x-8">
          {rest[1] ? (
            <Plate
              image={rest[1]}
              ratio="aspect-square"
              sizes="(min-width: 768px) 34vw, 60vw"
              className="col-span-8 md:col-span-4 md:col-start-2"
            />
          ) : null}
          {rest[2] ? (
            <Plate
              image={rest[2]}
              ratio="aspect-[4/3]"
              sizes="(min-width: 768px) 40vw, 100vw"
              className="col-span-12 mt-10 md:col-span-5 md:col-start-8 md:mt-24"
              delay={0.08}
            />
          ) : null}
        </div>

        {/* Movement three — a quiet detail, then a long horizontal to close. */}
        <div className="mt-16 grid grid-cols-12 gap-x-4 md:mt-28 md:gap-x-8">
          {rest[3] ? (
            <Plate
              image={rest[3]}
              ratio="aspect-[4/5]"
              sizes="(min-width: 768px) 24vw, 50vw"
              className="col-span-6 md:col-span-3 md:col-start-2"
            />
          ) : null}
          {rest[4] ? (
            <Plate
              image={rest[4]}
              ratio="aspect-[16/9]"
              sizes="(min-width: 768px) 48vw, 100vw"
              className="col-span-12 mt-10 md:col-span-6 md:col-start-6 md:-mt-16"
              delay={0.08}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
