'use client';

import { SECTION_IDS, useActiveSection, useSectionLabels } from '@/components/site/SiteNav';
import { ChatIcon, InfoIcon, MenuGridIcon, PinIcon, TagIcon } from '@/components/ui/icons';
import { HEADER_HEIGHT, scrollToElement } from '@/lib/client-scroll';
import type { Dictionary } from '@/lib/i18n';

const ICONS: Record<(typeof SECTION_IDS)[number], typeof MenuGridIcon> = {
  menu: MenuGridIcon,
  promotions: TagIcon,
  about: InfoIcon,
  visit: PinIcon,
  contact: ChatIcon,
};

/** Phone-only bottom navigation: the five sections, in scroll order, plus safe-area padding. */
export function BottomNav({ nav, label }: { nav: Dictionary['nav']; label: string }) {
  const active = useActiveSection();
  const labels = useSectionLabels(nav);

  const go = (id: (typeof SECTION_IDS)[number]) => {
    const target = document.getElementById(id);
    if (target) scrollToElement(target, HEADER_HEIGHT);
  };

  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-14 grid-cols-5">
        {SECTION_IDS.map((id) => {
          const Icon = ICONS[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={active === id ? 'page' : undefined}
                className={`tap flex h-full w-full flex-col items-center justify-center gap-1 transition-colors duration-150 ${active === id ? 'text-accent' : 'text-ink/60'}`}
              >
                <Icon size={20} />
                <span className="text-nav-label">{labels[id]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
