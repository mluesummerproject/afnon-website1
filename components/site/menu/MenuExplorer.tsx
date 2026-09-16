'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBasket } from '@/components/site/basket/BasketProvider';
import { EmptyState } from '@/components/site/EmptyState';
import { CategoryStrip } from '@/components/site/menu/CategoryStrip';
import { DishCard } from '@/components/site/menu/DishCard';
import type { CardLabels } from '@/components/site/menu/DishParts';
import { PhotoSheet } from '@/components/site/menu/PhotoSheet';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import { observeReveal } from '@/components/ui/motion/useReveal';
import { MENU_OFFSET, onScrollSettled, scrollToElement } from '@/lib/client-scroll';
import { format, plural, type Dictionary, type Locale } from '@/lib/i18n';
import { activeIndex } from '@/lib/scrollspy';
import { filterCategories } from '@/lib/search';
import type { Dish, DishCategory } from '@/lib/types';

type MenuExplorerProps = {
  status: 'ok' | 'empty' | 'error';
  categories: DishCategory[];
  locale: Locale;
  search: Dictionary['search'];
  picksHeading: string;
  menu: Dictionary['menu'];
};

export function MenuExplorer({ status, categories, locale, search, picksHeading, menu }: MenuExplorerProps) {
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [sheetDish, setSheetDish] = useState<Dish | null>(null);
  const headings = useRef(new Map<string, HTMLElement>());
  const locked = useRef(false);
  const cancelSettle = useRef<(() => void) | null>(null);
  const { dishes: basketDishes } = useBasket();

  // Live filter, debounced 150ms.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(rawQuery), 150);
    return () => window.clearTimeout(timer);
  }, [rawQuery]);

  const filtered = useMemo(() => filterCategories(categories, query), [categories, query]);
  const searching = query.trim().length > 0;
  const resultCount = filtered.reduce((total, category) => total + category.dishes.length, 0);
  const picks = useMemo(
    () => categories.flatMap((category) => category.dishes).filter((dish) => dish.available).sort((a, b) => a.rank - b.rank).slice(0, 6),
    [categories],
  );
  const [active, setActive] = useState(filtered[0]?.slug ?? '');

  const labels: CardLabels & { close: string; photoPosition: string; showPhoto: string } = menu;

  // Scrollspy: the last heading that has reached the sticky header + strip.
  useEffect(() => {
    let frame = 0;
    const slugs = filtered.map((category) => category.slug);
    const update = () => {
      frame = 0;
      if (locked.current || slugs.length === 0) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const tops = slugs.map((slug) => headings.current.get(slug)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY);
      const lastInMenu = tops[tops.length - 1] < window.innerHeight;
      const slug = atBottom && lastInMenu ? slugs[slugs.length - 1] : slugs[activeIndex(tops, MENU_OFFSET + 2)];
      setActive((current) => (current === slug ? current : slug));
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
  }, [filtered]);

  const jump = useCallback((slug: string) => {
    const heading = headings.current.get(slug);
    if (!heading) return;
    setActive(slug);
    locked.current = true;
    cancelSettle.current?.();
    scrollToElement(heading, MENU_OFFSET);
    cancelSettle.current = onScrollSettled(() => {
      locked.current = false;
      heading.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => () => cancelSettle.current?.(), []);

  const cardProps = { locale, labels, onOpen: setSheetDish };

  return (
    <>
      <div className="shell pt-3">
        <div className="relative">
          <label htmlFor="menu-search" className="sr-only">
            {search.label}
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/60" />
          <input
            id="menu-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={rawQuery}
            onChange={(event) => setRawQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
            }}
            placeholder={search.placeholder}
            className="h-11 w-full rounded-[12px] bg-fill pl-11 pr-11 text-[16px] text-ink outline-none placeholder:text-ink/60 focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-search-cancel-button]:appearance-none"
          />
          {rawQuery ? (
            <button
              type="button"
              onClick={() => setRawQuery('')}
              aria-label={search.clear}
              className="tap absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-ink/60"
            >
              <CloseIcon size={18} />
            </button>
          ) : null}
        </div>
        <p className="sr-only" aria-live="polite">
          {searching ? plural(search.results, resultCount, locale) : ''}
        </p>
      </div>

      {status === 'ok' && !searching && picks.length > 0 ? (
        <section aria-labelledby="picks-heading" className="pt-6">
          <h2 id="picks-heading" className="shell text-section">
            {picksHeading}
          </h2>
          <div className="no-scrollbar mx-auto mt-3 flex max-w-[75rem] snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 md:scroll-px-6 md:px-6">
            {picks.map((dish, position) => (
              <DishCard key={`pick-${dish.id}`} dish={dish} variant="rail" priority={position < 2} {...cardProps} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="menu" aria-label={menu.categoriesNav} className="scroll-mt-14 pt-4">
        {status === 'ok' && filtered.length > 0 ? (
          <div className="lg:hidden">
            <CategoryStrip categories={filtered.map(({ slug, label }) => ({ slug, label }))} active={active} onSelect={jump} label={menu.categoriesNav} />
          </div>
        ) : null}

        <div className="shell lg:grid lg:grid-cols-[13rem_1fr] lg:items-start lg:gap-8">
          {status === 'ok' && filtered.length > 0 ? (
            <nav aria-label={menu.categoriesNav} className="sticky top-[4.5rem] hidden max-h-[calc(100svh-6rem)] overflow-y-auto pb-6 pt-5 lg:block">
              <ul className="space-y-0.5 border-l border-line pl-1">
                {filtered.map((category) => {
                  const isActive = category.slug === active;
                  return (
                    <li key={category.slug} className="relative">
                      {isActive ? <span aria-hidden="true" className="absolute -left-1 top-1 bottom-1 w-0.5 rounded-full bg-accent transition-all duration-200" /> : null}
                      <button
                        type="button"
                        onClick={() => jump(category.slug)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`block w-full rounded-[8px] px-3 py-2 text-left text-[14px] font-medium transition-colors duration-150 ${
                          isActive ? 'bg-accent/[0.08] text-accent' : 'text-ink/65 hover:bg-fill hover:text-ink'
                        }`}
                      >
                        {category.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}

          <div className="min-w-0">
            {status === 'error' ? (
              <EmptyState kind="menu" text={menu.error}>
                <button type="button" onClick={() => window.location.reload()} className="tap mt-4 h-11 rounded-[22px] bg-accent px-6 text-button text-white">
                  {menu.retry}
                </button>
              </EmptyState>
            ) : status === 'empty' ? (
              <EmptyState kind="menu" text={menu.empty} />
            ) : searching && filtered.length === 0 ? (
              <EmptyState kind="search" text={format(search.noResults, { query: query.trim() })}>
                <button type="button" onClick={() => setRawQuery('')} className="tap mt-4 h-11 rounded-[22px] bg-accent px-6 text-button text-white">
                  {search.showAll}
                </button>
              </EmptyState>
            ) : (
              filtered.map((category) => (
                <section key={category.slug} aria-labelledby={`cat-${category.slug}`} className="pt-6 first:lg:pt-5">
                  <h2
                    id={`cat-${category.slug}`}
                    tabIndex={-1}
                    ref={(element) => {
                      if (element) {
                        headings.current.set(category.slug, element);
                        observeReveal(element);
                      } else headings.current.delete(category.slug);
                    }}
                    className="reveal-heading scroll-mt-[108px] text-section outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {category.label}
                  </h2>
                  <div className="stagger-grid mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {category.dishes.map((dish, position) => (
                      <DishCard key={dish.id} dish={dish} index={position} {...cardProps} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </section>

      {basketDishes ? <PhotoSheet dish={sheetDish} onClose={() => setSheetDish(null)} labels={labels} /> : null}
    </>
  );
}
