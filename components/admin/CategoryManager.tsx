'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { deleteCategoryLabel, moveCategoryFromTab, saveCategoryLabel } from '@/app/admin/category-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { useT } from '@/components/admin/AdminLangProvider';
import { Chevron } from '@/components/admin/AdminMenu';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { useReorderList } from '@/components/admin/useReorderList';
import type { CategoryOverview } from '@/lib/admin-data';
import { format } from '@/lib/i18n';

/**
 * One row per category, in the exact order guests see on the website. Renaming
 * a language's label only changes how it reads — the underlying category text
 * that ties dishes together never changes here.
 */
export function CategoryManager({ categories }: { categories: CategoryOverview[] }) {
  const t = useT();
  const { list, move, reset } = useReorderList(categories, (entry) => entry.category);
  return (
    <div className="mt-6">
      {list.length === 0 ? (
        <AdminEmpty>{t.categories.empty}</AdminEmpty>
      ) : (
        <ul className="mt-2 divide-y divide-line border-t border-line-strong">
          {list.map((entry, index) => (
            <CategoryRow key={entry.category} entry={entry} index={index} isFirst={index === 0} isLast={index === list.length - 1} onMove={move} onMoveFailed={reset} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  entry,
  index,
  isFirst,
  isLast,
  onMove,
  onMoveFailed,
}: {
  entry: CategoryOverview;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (category: string, direction: 'up' | 'down') => void;
  onMoveFailed: () => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const sortOrder = entry.label?.sort_order ?? (index + 1) * 10;

  return (
    <motion.li layout="position" transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="-mx-3 rounded-hair px-3 py-5 transition-colors duration-quick hover:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="figures label w-5 shrink-0 text-ink-muted">{index + 1}</span>
          <h2 className="font-display text-display-sm text-ink">{entry.category}</h2>
          <span className="label figures rounded-pill bg-paper-alt px-1.5 text-micro font-semibold text-ink-secondary">
            {entry.dishCount === 1 ? t.categories.oneDish : format(t.categories.dishes, { count: entry.dishCount })}
          </span>
        </div>
        <div className="flex gap-1.5">
          <ActionForm action={moveCategoryFromTab} onResult={(result) => (result.ok ? undefined : onMoveFailed())}>
            <input type="hidden" name="category" value={entry.category} />
            <input type="hidden" name="direction" value="up" />
            <SubmitButton variant="icon" disabled={isFirst} onClick={() => onMove(entry.category, 'up')} aria-label={format(t.categories.moveUp, { category: entry.category })}>
              <Chevron direction="up" />
            </SubmitButton>
          </ActionForm>
          <ActionForm action={moveCategoryFromTab} onResult={(result) => (result.ok ? undefined : onMoveFailed())}>
            <input type="hidden" name="category" value={entry.category} />
            <input type="hidden" name="direction" value="down" />
            <SubmitButton variant="icon" disabled={isLast} onClick={() => onMove(entry.category, 'down')} aria-label={format(t.categories.moveDown, { category: entry.category })}>
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
            { key: 'name_uz', label: t.form.uz },
            { key: 'name_ru', label: t.form.ru },
            { key: 'name_en', label: t.form.en },
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
        <SubmitButton variant="secondary" pendingLabel={t.categories.saving} savedLabel={t.toast.savedShort} className="shrink-0">
          {t.categories.saveNames}
        </SubmitButton>
      </ActionForm>

      {entry.dishCount === 0 ? (
        <div className="mt-3">
          {confirming ? (
            <ActionForm action={deleteCategoryLabel} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="category" value={entry.category} />
              <p className="text-micro text-ink">{format(t.categories.removeConfirm, { category: entry.category })}</p>
              <SubmitButton variant="danger" pendingLabel={t.categories.removing}>
                {t.categories.removeYes}
              </SubmitButton>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-[2.75rem] px-3 text-label font-medium uppercase text-ink-secondary">
                {t.categories.keep}
              </button>
            </ActionForm>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="min-h-[2.75rem] text-label font-medium uppercase text-critical">
              {t.categories.removeEmpty}
            </button>
          )}
        </div>
      ) : null}
    </motion.li>
  );
}
