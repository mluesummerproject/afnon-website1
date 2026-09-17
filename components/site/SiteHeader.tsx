'use client';

import { useEffect, useState } from 'react';

import { BasketBadge } from '@/components/site/basket/BasketBadge';
import { useBasket } from '@/components/site/basket/BasketProvider';
import { LanguageMenu } from '@/components/site/LanguageMenu';
import { MobileNavControl, SiteNav } from '@/components/site/SiteNav';
import { AnorMark } from '@/components/ui/AnorMark';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BasketIcon, PhoneIcon } from '@/components/ui/icons';
import { HEADER_HEIGHT, scrollToElement, scrollToY } from '@/lib/client-scroll';
import type { Dictionary, Locale } from '@/lib/i18n';
import { CORE_SECTION_IDS, type SectionId } from '@/lib/sections';
import type { Theme } from '@/lib/theme';

type SiteHeaderProps = {
  locale: Locale;
  brandName: string;
  phoneHref: string | null;
  nav: Dictionary['nav'];
  labels: { home: string; cta: string; basket: string; call: string; language: string; switchTo: string; siteNav: string };
  /** The sections this page actually renders, in scroll order. */
  sections?: SectionId[];
  theme: Theme;
  themeLabels: Dictionary['theme'];
};

/**
 * 56px header: wordmark left; language, call and one solid accent CTA right.
 * Past 80px of scroll it settles into a slim white bar with a hairline, over 200ms.
 */
export function SiteHeader({ locale, brandName, phoneHref, nav, labels, sections = CORE_SECTION_IDS, theme, themeLabels }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { count, openBasket } = useBasket();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onCta = () => {
    if (count > 0) {
      openBasket();
      return;
    }
    const menu = document.getElementById('menu');
    if (menu) scrollToElement(menu, HEADER_HEIGHT);
  };

  return (
    <header
      className={`sticky top-0 z-40 h-14 border-b transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled ? 'border-line bg-card shadow-[0_1px_8px_rgba(0,0,0,0.04)]' : 'border-transparent bg-page'
      }`}
    >
      <div className="shell flex h-full items-center gap-1">
        <a
          href="#top"
          aria-label={labels.home}
          onClick={(event) => {
            event.preventDefault();
            scrollToY(0);
          }}
          className="mr-auto flex h-11 min-w-0 items-center gap-2 pr-1"
        >
          <AnorMark className="h-6 w-auto shrink-0 text-accent-ink" pulse />
          <span className={`origin-left font-wordmark text-[26px] leading-none text-ink transition-transform duration-200 ${scrolled ? 'scale-[0.92]' : ''}`}>
            {brandName}
          </span>
        </a>

        <SiteNav nav={nav} ariaLabel={labels.siteNav} sections={sections} />

        <MobileNavControl nav={nav} openLabel={nav.openMenu} closeLabel={nav.closeMenu} sections={sections} />

        <LanguageMenu locale={locale} label={labels.language} switchTo={labels.switchTo} />

        <ThemeToggle
          initial={theme}
          labels={themeLabels}
          className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fill"
        />

        {phoneHref ? (
          <a
            href={phoneHref}
            aria-label={labels.call}
            className="tap hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fill md:flex"
          >
            <PhoneIcon size={21} />
          </a>
        ) : null}

        {/* Always present (not just desktop) — it's both a real basket shortcut on a phone
            and the landing target for the fly-to-basket animation. */}
        <button
          type="button"
          onClick={openBasket}
          aria-label={labels.basket}
          className="tap relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fill"
        >
          <span className="relative" data-basket-target>
            <BasketIcon />
            <BasketBadge />
          </span>
        </button>

        <button type="button" onClick={onCta} className="tap ml-1 h-10 shrink-0 rounded-[20px] bg-accent px-4 text-button text-white">
          {labels.cta}
        </button>
      </div>
    </header>
  );
}
