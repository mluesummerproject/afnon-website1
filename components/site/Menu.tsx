import { Suspense } from 'react';

import { MenuBoard, MenuIndex } from '@/components/site/MenuBoard';
import { MenuSkeleton } from '@/components/site/MenuStates';
import { ArchFrame } from '@/components/ui/ArchFrame';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { images, menuSection } from '@/lib/site';

/**
 * The menu reads as a printed card: a narrow standing column on the left
 * (heading, category index, one plate) and the list itself running long down
 * the right. No item is a card; nothing is boxed.
 */
export function Menu() {
  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className="scroll-mt-20 bg-paper-alt py-section-y"
    >
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="menu-heading"
              index={menuSection.index}
              kicker={menuSection.kicker}
              heading={menuSection.heading}
            />

            <Reveal delay={0.05}>
              <p className="mt-6 max-w-measure text-body text-ink-secondary">{menuSection.lead}</p>
            </Reveal>

            <Suspense fallback={null}>
              <MenuIndex />
            </Suspense>

            <Reveal delay={0.1}>
              <ArchFrame
                image={images.menuFeature}
                ratio="aspect-[4/5]"
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="mt-12 hidden lg:block"
              />
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <Suspense fallback={<MenuSkeleton />}>
            <MenuBoard />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
