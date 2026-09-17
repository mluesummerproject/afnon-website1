'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { HEADER_HEIGHT, scrollToElement } from '@/lib/client-scroll';
import type { Dictionary } from '@/lib/i18n';
import { CORE_SECTION_IDS, type SectionId } from '@/lib/sections';

/** Which section is current: the last one whose top has reached the sticky header. */
export function useActiveSection(sections: SectionId[] = CORE_SECTION_IDS): SectionId {
  const [active, setActive] = useState<SectionId>('menu');
  const key = sections.join(',');
  useEffect(() => {
    let frame = 0;
    const ids = key.split(',') as SectionId[];
    const update = () => {
      frame = 0;
      let current: SectionId = 'menu';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= HEADER_HEIGHT + 24) current = id;
      }
      setActive((value) => (value === current ? value : current));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key]);
  return active;
}

export function useSectionLabels(nav: Dictionary['nav']): Record<SectionId, string> {
  return { menu: nav.menu, films: nav.films, promotions: nav.promotions, about: nav.about, visit: nav.visit, contact: nav.contact };
}

/** Desktop-only horizontal nav with one shared sliding indicator under the active link. */
export function SiteNav({ nav, ariaLabel, sections = CORE_SECTION_IDS }: { nav: Dictionary['nav']; ariaLabel: string; sections?: SectionId[] }) {
  const active = useActiveSection(sections);
  const labels = useSectionLabels(nav);

  const go = (id: SectionId) => {
    const target = document.getElementById(id);
    if (target) scrollToElement(target, HEADER_HEIGHT);
  };

  return (
    <nav aria-label={ariaLabel} className="hidden items-center gap-1 md:flex">
      <LayoutGroup id="site-nav">
        {sections.map((id) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-[14px] font-medium transition-colors duration-150 ${
                isActive ? 'text-accent-ink' : 'text-ink/65 hover:text-ink'
              }`}
            >
              {isActive ? <motion.span layoutId="site-nav-indicator" className="absolute inset-0 rounded-full bg-accent/[0.08]" transition={{ duration: 0.25, ease: 'easeOut' }} /> : null}
              <span className="relative">{labels[id]}</span>
            </button>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}

/** Mobile "menu control": a compact hamburger that opens a slide-down panel with the same links. */
export function MobileNavControl({
  nav,
  openLabel,
  closeLabel,
  sections = CORE_SECTION_IDS,
}: {
  nav: Dictionary['nav'];
  openLabel: string;
  closeLabel: string;
  sections?: SectionId[];
}) {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(sections);
  const labels = useSectionLabels(nav);

  const go = (id: SectionId) => {
    setOpen(false);
    const target = document.getElementById(id);
    if (target) scrollToElement(target, HEADER_HEIGHT);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? closeLabel : openLabel}
        className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fill"
      >
        <span className="relative block h-3.5 w-4">
          <span className={`absolute inset-x-0 top-0 h-[1.5px] bg-current transition-transform duration-200 ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-current transition-opacity duration-150 ${open ? 'opacity-0' : ''}`} />
          <span className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-current transition-transform duration-200 ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 top-14 z-40 border-b border-line bg-card px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <ul className="space-y-1">
              {sections.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go(id)}
                    aria-current={active === id ? 'page' : undefined}
                    className={`tap flex h-11 w-full items-center rounded-[10px] px-3 text-[15px] font-medium ${
                      active === id ? 'bg-accent/[0.08] text-accent-ink' : 'text-ink/80'
                    }`}
                  >
                    {labels[id]}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
