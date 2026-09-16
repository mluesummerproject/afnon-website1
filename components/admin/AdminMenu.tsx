'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { moveCategory } from '@/app/admin/actions';
import { DishRow } from '@/components/admin/DishRow';
import { ItemForm } from '@/components/admin/ItemForm';
import { toast } from '@/components/admin/toast';
import type { AdminDish } from '@/lib/admin-types';
import { groupByCategory } from '@/lib/ordering';

const opposite = { up: 'down', down: 'up' } as const;

/** Calls the moveCategory Server Action imperatively (outside a <form>), so a button press can be undone with one more call. */
function moveCategoryOnce(category: string, direction: 'up' | 'down') {
  const formData = new FormData();
  formData.set('category', category);
  formData.set('direction', direction);
  return moveCategory(null, formData);
}

type Filter = 'all' | 'unavailable' | 'translations' | 'photos' | 'descriptions';

const blank = (value: string | null) => !value || value.trim() === '';

export function missingTranslations(dish: AdminDish): string[] {
  const missing: string[] = [];
  if (blank(dish.name_uz) && blank(dish.name)) missing.push('UZ');
  if (blank(dish.name_ru)) missing.push('RU');
  if (blank(dish.name_en)) missing.push('EN');
  return missing;
}

/** True when the dish has no description in any language — visitors see nothing on the card or in the sheet. */
export function missingDescription(dish: AdminDish): boolean {
  return blank(dish.description) && blank(dish.description_uz) && blank(dish.description_ru) && blank(dish.description_en);
}

/**
 * The operational view: what exists, what needs attention, one tap to add.
 * Filters and search are instant (client-side) so it stays fast at 150+ dishes;
 * reordering is only offered on the full, unfiltered list so a move is never
 * made against a partial view.
 */
export function AdminMenu({ dishes, categories }: { dishes: AdminDish[]; categories: string[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  const [categoryPending, setCategoryPending] = useState(false);

  const moveCategoryWithUndo = useCallback(async (category: string, direction: 'up' | 'down') => {
    if (categoryPending) return;
    setCategoryPending(true);
    try {
      const result = await moveCategoryOnce(category, direction);
      if (!result) return;
      toast({
        ok: result.ok,
        message: result.message,
        action: result.ok && result.message.includes('moved') ? { label: 'Undo', run: () => void moveCategoryOnce(category, opposite[direction]) } : undefined,
      });
    } catch {
      toast({ ok: false, message: 'Something went wrong. Check the connection and try again.' });
    } finally {
      setCategoryPending(false);
    }
  }, [categoryPending]);

  const counts = useMemo(
    () => ({
      all: dishes.length,
      unavailable: dishes.filter((dish) => dish.is_available === false).length,
      translations: dishes.filter((dish) => missingTranslations(dish).length > 0).length,
      photos: dishes.filter((dish) => dish.images.length === 0 && blank(dish.image_url)).length,
      descriptions: dishes.filter((dish) => missingDescription(dish)).length,
    }),
    [dishes],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return dishes.filter((dish) => {
      if (filter === 'unavailable' && dish.is_available !== false) return false;
      if (filter === 'translations' && missingTranslations(dish).length === 0) return false;
      if (filter === 'photos' && !(dish.images.length === 0 && blank(dish.image_url))) return false;
      if (filter === 'descriptions' && !missingDescription(dish)) return false;
      if (!needle) return true;
      return [dish.name, dish.name_uz, dish.name_ru, dish.name_en, dish.category]
        .some((value) => value?.toLocaleLowerCase().includes(needle));
    });
  }, [dishes, filter, query]);

  const reorderable = filter === 'all' && query.trim() === '';
  const groups = groupByCategory(visible);
  const allGroups = groupByCategory(dishes);

  // After adding a dish, open it and bring it into view once the fresh list arrives.
  useEffect(() => {
    if (scrollTo === null) return;
    const element = document.getElementById(`dish-${scrollTo}`);
    if (!element) return;
    setOpenId(scrollTo);
    window.setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    setScrollTo(null);
  }, [dishes, scrollTo]);

  const onCreated = useCallback((id: number) => {
    setAdding(false);
    setFilter('all');
    setQuery('');
    setScrollTo(id);
  }, []);

  const filters: { key: Filter; label: string; tone?: 'alert' }[] = [
    { key: 'all', label: 'All dishes' },
    { key: 'unavailable', label: 'Unavailable', tone: 'alert' },
    { key: 'translations', label: 'Missing translations', tone: 'alert' },
    { key: 'photos', label: 'No photos', tone: 'alert' },
    { key: 'descriptions', label: 'No description', tone: 'alert' },
  ];

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setAdding((value) => !value)}
        aria-expanded={adding}
        className="flex min-h-[3.25rem] w-full items-center justify-center gap-3 rounded-hair bg-anor px-6 text-label-lg font-medium uppercase text-paper transition-colors hover:bg-anor-hover sm:w-auto"
      >
        <span aria-hidden="true" className="text-lg leading-none">{adding ? '×' : '+'}</span>
        {adding ? 'Close' : 'Add a new dish'}
      </button>

      {adding ? (
        <section aria-labelledby="new-dish" className="mt-4 border-l-2 border-anor bg-surface p-4 md:p-6">
          <h2 id="new-dish" className="font-display text-display-sm text-ink">New dish</h2>
          <p className="mt-1 text-body-sm text-ink-secondary">It goes to the end of its category. You can add photos right after saving.</p>
          <div className="mt-6">
            <ItemForm categories={categories} onCreated={onCreated} />
          </div>
        </section>
      ) : null}

      {/* What needs attention — each count is also a filter. */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Show">
        {filters.map((item) => {
          const active = filter === item.key;
          const count = counts[item.key];
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.key)}
              className={`flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-hair border px-3.5 text-body-sm transition-colors ${
                active ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink hover:border-ink'
              }`}
            >
              {item.label}
              <span
                className={`figures rounded-pill px-1.5 text-micro font-semibold ${
                  active ? 'bg-paper/20' : item.tone === 'alert' && count > 0 ? 'bg-anor-tint text-anor' : 'bg-paper-alt text-ink-secondary'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Search dishes</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or category, in any language"
          className="field border-line-strong"
        />
      </label>

      {!reorderable && dishes.length > 0 ? (
        <p className="mt-3 text-micro text-ink-muted">Reordering is available when showing all dishes without a search.</p>
      ) : null}

      {dishes.length === 0 ? (
        <div className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-display-sm text-ink">The menu is empty.</h2>
          <p className="mt-2 max-w-measure text-body-sm text-ink-secondary">Add the first dish with the button above. It appears on the website as soon as you save it.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 border-t border-line pt-8 text-body-sm text-ink-secondary">Nothing matches. Try another search or filter.</p>
      ) : null}

      <div className="mt-8 space-y-10">
        {groups.map((group) => {
          const fullIndex = allGroups.findIndex((candidate) => candidate.name === group.name);
          return (
            <section key={group.name} aria-label={group.name}>
              <div className="sticky top-[6.5rem] z-10 flex items-center justify-between gap-3 border-b border-line-strong bg-paper py-3 md:top-[7rem]">
                <h2 className="min-w-0 font-display text-display-sm text-ink">
                  <span className="truncate">{group.name}</span>{' '}
                  <span className="label figures align-middle text-ink-muted">{group.items.length}</span>
                </h2>
                {reorderable && allGroups.length > 1 ? (
                  <div className="flex shrink-0 gap-1.5">
                    {(['up', 'down'] as const).map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        disabled={categoryPending || (direction === 'up' ? fullIndex === 0 : fullIndex === allGroups.length - 1)}
                        onClick={() => void moveCategoryWithUndo(group.name, direction)}
                        aria-label={`Move category ${group.name} ${direction}`}
                        className="inline-flex min-h-[2.75rem] w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Chevron direction={direction} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <ul>
                {group.items.map((dish, index) => (
                  <DishRow
                    key={dish.id}
                    dish={dish}
                    position={index + 1}
                    isFirst={index === 0}
                    isLast={index === group.items.length - 1}
                    reorderable={reorderable}
                    open={openId === dish.id}
                    onToggle={() => setOpenId((current) => (current === dish.id ? null : dish.id))}
                    categories={categories}
                    missing={missingTranslations(dish)}
                    noDescription={missingDescription(dish)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function Chevron({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const paths = { up: 'M1 7L6 2L11 7', down: 'M1 2L6 7L11 2', left: 'M7 1L2 6L7 11', right: 'M2 1L7 6L2 11' };
  const horizontal = direction === 'left' || direction === 'right';
  return (
    <svg aria-hidden="true" width={horizontal ? 9 : 12} height={horizontal ? 12 : 9} viewBox={horizontal ? '0 0 9 12' : '0 0 12 9'} fill="none">
      <path d={paths[direction]} stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
