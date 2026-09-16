'use client';

import { motion } from 'framer-motion';

import { AnorMark } from '@/components/ui/AnorMark';
import { HEADER_HEIGHT, scrollToElement } from '@/lib/client-scroll';
import type { Dictionary } from '@/lib/i18n';

const rise = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/**
 * The first thing anyone sees, and it needs nothing from the database: the
 * mark, the name, the always-open badge, a short tagline and two ways
 * forward. The background is a slow, continuous drift built from the brand
 * red — never static, never loud — plus two faint arch-mark watermarks so it
 * reads as branded, not generic. Its own children rise in staggered 60ms
 * apart on mount, whether or not the opening sequence played first.
 */
export function SiteHero({ brandName, hero, badge }: { brandName: string; hero: Dictionary['hero']; badge: string }) {
  const goTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) scrollToElement(target, HEADER_HEIGHT);
  };

  return (
    <section aria-label={brandName} className="hero-drift relative isolate flex min-h-[86svh] flex-col items-center justify-center overflow-hidden px-4 pb-14 pt-[calc(var(--header-h)+2.5rem)] text-center text-white">
      <AnorMark className="hero-mark-bg absolute -left-10 top-10 h-64 w-64 text-white/[0.07]" outline />
      <AnorMark className="hero-mark-bg hero-mark-bg-2 absolute -right-14 bottom-0 h-80 w-80 text-white/[0.06]" outline />

      <motion.div
        className="relative flex flex-col items-center"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={rise}>
          <AnorMark className="h-12 w-auto text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)]" />
        </motion.div>
        <motion.h1 variants={rise} className="mt-4 font-wordmark text-[2.75rem] leading-none text-white sm:text-[3.25rem]">
          {brandName}
        </motion.h1>

        <motion.span variants={rise} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur-sm">
          <span className="pulse-dot relative block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" data-intro-target="badge" />
          {badge}
        </motion.span>

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
      </motion.div>
    </section>
  );
}
