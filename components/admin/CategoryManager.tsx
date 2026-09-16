'use client';

import { useState } from 'react';

import { deleteCategoryLabel, moveCategoryFromTab, saveCategoryLabel } from '@/app/admin/category-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { Chevron } from '@/components/admin/AdminMenu';
import { SubmitButton } from '@/components/admin/SubmitButton';
import type { CategoryOverview } from '@/lib/admin-data';

/**
 * One row per category, in the exact order guests see on the website. Renaming
 * a language's label only changes how it reads — the underlying category text
 * that ties dishes together never changes here.
 */
export function CategoryManager({ categories }: { categories: CategoryOverview[] }) {
  return (
    <div className="mt-6">
      {categories.length === 0 ? (
        <p className="mt-6 text-body-sm text-ink-secondary">No categories yet — add a dish from the Menu tab and its category appears here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-t border-line-strong">
          {categories.map((entry, index) => (
            <CategoryRow key={entry.category} entry={entry} index={index} isFirst={index === 0} isLast={index === categories.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({ entry, index, isFirst, isLast }: { entry: CategoryOverview; index: number; isFirst: boolean; isLast: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const sortOrder = entry.label?.sort_order ?? (index + 1) * 10;

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="figures label w-5 shrink-0 text-ink-muted">{index + 1}</span>
          <h2 className="font-display text-display-sm text-ink">{entry.category}</h2>
          <span className="label figures rounded-pill bg-paper-alt px-1.5 text-micro font-semibold text-ink-secondary">
            {entry.dishCount} dish{entry.dishCount === 1 ? '' : 'es'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <ActionForm action={moveCategoryFromTab}>
            <input type="hidden" name="category" value={entry.category} />
            <input type="hidden" name="direction" value="up" />
            <SubmitButton variant="icon" disabled={isFirst} aria-label={`Move ${entry.category} up`}>
              <Chevron direction="up" />
            </SubmitButton>
          </ActionForm>
          <ActionForm action={moveCategoryFromTab}>
            <input type="hidden" name="category" value={entry.category} />
            <input type="hidden" name="direction" value="down" />
            <SubmitButton variant="icon" disabled={isLast} aria-label={`Move ${entry.category} down`}>
              <Chevron direction="down" />
            </SubmitButton>
          </ActionForm>
        </div>
      </div>

      <ActionForm action={saveCategoryLabel} className="mt-4 grid gap-3 md:grid-cols-[repeat(3,1fr)_auto] md:items-end">
        <input type="hidden" name="category" value={entry.category} />
        <input type="hidden" name="sort_order" value={sortOrder} />
        {(
          [
            { key: 'name_uz', label: 'O‘zbekcha' },
            { key: 'name_ru', label: 'Русский' },
            { key: 'name_en', label: 'English' },
          ] as const
        ).map((language) => (
          <label key={language.key} className="block">
            <span className="text-body-sm font-medium text-ink">{language.label}</span>
            <input
              name={language.key}
              maxLength={80}
              defaultValue={entry.label?.[language.key] ?? entry.category}
              className="field mt-1.5 border-line-strong"
              autoComplete="off"
            />
          </label>
        ))}
        <SubmitButton variant="secondary" pendingLabel="Saving…" className="shrink-0">
          Save names
        </SubmitButton>
      </ActionForm>

      {entry.dishCount === 0 ? (
        <div className="mt-3">
          {confirming ? (
            <ActionForm action={deleteCategoryLabel} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="category" value={entry.category} />
              <p className="text-micro text-ink">Remove “{entry.category}” — it has no dishes left?</p>
              <SubmitButton variant="danger" pendingLabel="Removing…">
                Yes, remove
              </SubmitButton>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-[2.75rem] px-3 text-label font-medium uppercase text-ink-secondary">
                Keep
              </button>
            </ActionForm>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="min-h-[2.75rem] text-label font-medium uppercase text-critical">
              Remove this empty category…
            </button>
          )}
        </div>
      ) : null}
    </li>
  );
}
