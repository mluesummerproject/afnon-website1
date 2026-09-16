'use client';

import { motion } from 'framer-motion';

import { HeroCarousel, type HeroSlide } from '@/components/site/HeroCarousel';
import { AnorMark } from '@/components/ui/AnorMark';
import { HEADER_HEIGHT, scrollToElement } from '@/lib/client-scroll';
import type { Dictionary } from '@/lib/i18n';

const rise = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/**
 * The first thing anyone sees. Two states, one section.
 *
 * With banners, the pictures staff chose are the hero, under a compact brand
 * line — that is what the Banners tab is for, and it is why the tab exists.
 * With none, it falls back to the brand block it has always been: mark,
 * name, always-open badge, tagline and two ways forward. Nothing is ever
 * invented to fill the space.
 *
 * Either way the section keeps its slow drifting gradient and the two faint
 * arch watermarks, its children still rise 60ms apart on mount, and the badge
 * still carries the landing target the opening sequence scatters seeds onto.
 */
export function SiteHero({
  brandName,
  hero,
  badge,
  slides,
  bannerLabels,
}: {
  brandName: string;
  hero: Dictionary['hero'];
  badge: string;
  slides: HeroSlide[];
  bannerLabels: Dictionary['banners'];
}) {
  const goTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) scrollToElement(target, HEADER_HEIGHT);
  };

  const hasBanners = slides.length > 0;

  return (
    <section
      aria-label={brandName}
      className={`hero-drift relative isolate flex flex-col items-center justify-center overflow-hidden px-4 text-center text-white ${
        hasBanners ? 'pb-8 pt-[calc(var(--header-h)+1.5rem)]' : 'min-h-[62svh] pb-12 pt-[calc(var(--header-h)+2rem)]'
      }`}
    >
      <AnorMark className="hero-mark-bg absolute -left-10 top-10 h-64 w-64 text-white/[0.07]" outline />
      <AnorMark className="hero-mark-bg hero-mark-bg-2 absolute -right-14 bottom-0 h-80 w-80 text-white/[0.06]" outline />

      <motion.div
        className="relative flex w-full max-w-[62rem] flex-col items-center"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={rise}>
          <AnorMark className={`w-auto text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)] ${hasBanners ? 'h-9' : 'h-12'}`} />
        </motion.div>

        <motion.h1
          variants={rise}
          className={`font-wordmark leading-none text-white ${hasBanners ? 'mt-3 text-[2rem] sm:text-[2.4rem]' : 'mt-4 text-[2.75rem] sm:text-[3.25rem]'}`}
        >
          {brandName}
        </motion.h1>

        <motion.span
          variants={rise}
          className={`inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur-sm ${
            hasBanners ? 'mt-3' : 'mt-5'
          }`}
        >
          <span className="pulse-dot relative block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" data-intro-target="badge" />
          {badge}
        </motion.span>

        {hasBanners ? (
          <motion.div variants={rise} className="mt-6 w-full">
            <HeroCarousel slides={slides} labels={bannerLabels} />
          </motion.div>
        ) : (
          <>
            <motion.p variants={rise} className="mt-4 max-w-[26rem] text-[15px] leading-relaxed text-white/85">
              {hero.tagline}
            </motion.p>

            <motion.div variants={rise} className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goTo('menu')}
                className="tap flex h-12 items-center justify-center rounded-[24px] bg-white px-7 text-button text-accent shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
              >
                {hero.menuCta}
              </button>
              <button
                type="button"
                onClick={() => goTo('visit')}
                className="tap flex h-12 items-center justify-center rounded-[24px] border border-white/40 px-7 text-button text-white"
              >
                {hero.visitCta}
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </section>
  );
}
