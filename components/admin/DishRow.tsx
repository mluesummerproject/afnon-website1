'use client';

import Image from 'next/image';
import { useState } from 'react';

import { deleteItem, moveItem, toggleAvailability } from '@/app/admin/actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { useT } from '@/components/admin/AdminLangProvider';
import { Chevron } from '@/components/admin/AdminMenu';
import { ImageManager } from '@/components/admin/ImageManager';
import { ItemForm } from '@/components/admin/ItemForm';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { StarIcon } from '@/components/ui/icons';
import type { AdminDish } from '@/lib/admin-types';
import { format } from '@/lib/i18n';
import { formatAmount } from '@/lib/menu-format';
import { formatAverage } from '@/lib/ratings';
import { discountPercent, toAmount } from '@/lib/pricing';

type DishRowProps = {
  dish: AdminDish;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  reorderable: boolean;
  open: boolean;
  onToggle: () => void;
  categories: string[];
  missing: string[];
  noDescription: boolean;
};

export function DishRow({ dish, position, isFirst, isLast, reorderable, open, onToggle, categories, missing, noDescription }: DishRowProps) {
  const t = useT();
  const unavailable = dish.is_available === false;
  const cover = dish.images[0]?.image_url ?? (dish.image_url?.startsWith('https://') ? dish.image_url : null);
  const photoCount = dish.images.length;
  const name = dish.name_uz?.trim() || dish.name?.trim() || dish.name_ru?.trim() || dish.name_en?.trim() || t.dish.untitled;
  const percent = discountPercent(toAmount(dish.price), toAmount(dish.old_price));

  return (
    <li id={`dish-${dish.id}`} className="scroll-mt-40 border-b border-line">
      <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="figures label w-5 shrink-0 pt-1.5 text-ink-muted">{position}</span>
          <div className="relative h-[3.75rem] w-12 shrink-0 overflow-hidden rounded-hair bg-paper-alt">
            {cover ? (
              <Image src={cover} alt="" fill sizes="48px" className="object-cover" unoptimized={!/supabase\.co|unsplash\.com/.test(cover)} />
            ) : (
              <span className="flex h-full items-center justify-center text-micro text-ink-muted" aria-hidden="true">—</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className={`font-display text-[1.25rem] leading-tight ${unavailable ? 'text-ink-muted' : 'text-ink'}`}>{name}</span>
              {unavailable ? <span className="label rounded-hair bg-critical/10 px-2 py-1 text-critical">{t.dish.unavailable}</span> : null}
              {dish.badge?.trim() ? <span className="label rounded-hair bg-anor-tint px-2 py-1 text-anor">{dish.badge.trim()}</span> : null}
              {percent !== null ? <span className="label figures rounded-hair bg-positive/15 px-2 py-1 text-positive">−{percent}%</span> : null}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-ink-secondary">
              <span className="figures">
                {dish.price?.trim() || <span className="text-critical">{t.dish.noPrice}</span>}
                {percent !== null && dish.old_price ? (
                  <span className="ml-1.5 text-ink-muted line-through">{formatAmount(toAmount(dish.old_price) ?? 0, '')}</span>
                ) : null}
              </span>
              <span aria-hidden="true" className="text-line-strong">·</span>
              {dish.rating ? (
                <span
                  className="figures inline-flex items-center gap-1 font-medium text-ink"
                  aria-label={format(t.dish.ratingAria, { average: formatAverage(dish.rating.average), count: dish.rating.count })}
                >
                  <StarIcon size={13} filled className="text-anor" />
                  {formatAverage(dish.rating.average)}
                  <span className="font-normal text-ink-muted">({dish.rating.count})</span>
                </span>
              ) : (
                <span className="text-ink-muted">{t.dish.noRatings}</span>
              )}
              <span aria-hidden="true" className="text-line-strong">·</span>
              <span className={photoCount === 0 ? 'text-ink-muted' : ''}>
                {photoCount === 0 ? t.dish.noPhotos : photoCount === 1 ? t.dish.onePhoto : format(t.dish.photos, { count: photoCount })}
              </span>
              <span aria-hidden="true" className="text-line-strong">·</span>
              <span className={noDescription ? 'text-ink-muted' : ''}>{noDescription ? t.dish.noDescription : t.dish.hasDescription}</span>
              <span aria-hidden="true" className="text-line-strong">·</span>
              <span className="flex gap-1.5" aria-label={missing.length ? format(t.dish.missing, { languages: missing.join(', ') }) : t.dish.allLanguages}>
                {['UZ', 'RU', 'EN'].map((code) => (
                  <span key={code} aria-hidden="true" className={missing.includes(code) ? 'text-ink-muted line-through' : 'font-medium text-positive'}>
                    {code}
                  </span>
                ))}
              </span>
            </p>
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 md:w-auto">
          {reorderable ? (
            <>
              <ActionForm action={moveItem}>
                <input type="hidden" name="id" value={dish.id} />
                <input type="hidden" name="direction" value="up" />
                <SubmitButton variant="icon" disabled={isFirst} aria-label={format(t.dish.moveUp, { name })}>
                  <Chevron direction="up" />
                </SubmitButton>
              </ActionForm>
              <ActionForm action={moveItem}>
                <input type="hidden" name="id" value={dish.id} />
                <input type="hidden" name="direction" value="down" />
                <SubmitButton variant="icon" disabled={isLast} aria-label={format(t.dish.moveDown, { name })}>
                  <Chevron direction="down" />
                </SubmitButton>
              </ActionForm>
            </>
          ) : null}

          <ActionForm action={toggleAvailability} className="min-w-0 flex-1 md:flex-none">
            <input type="hidden" name="id" value={dish.id} />
            <input type="hidden" name="next" value={unavailable ? 'true' : 'false'} />
            <SubmitButton variant="ghost" pendingLabel={t.dish.saving} className="w-full px-2 text-label sm:px-4 sm:text-label-lg">
              {unavailable ? t.dish.makeAvailable : t.dish.markUnavailable}
            </SubmitButton>
          </ActionForm>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`editor-${dish.id}`}
            className={`inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-hair border px-4 text-label-lg font-medium uppercase transition-colors ${
              open ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink hover:border-ink'
            }`}
          >
            {open ? t.dish.close : t.dish.edit}
          </button>
        </div>
      </div>

      {open ? (
        <div id={`editor-${dish.id}`} className="mb-6 space-y-8 border-l-2 border-anor bg-surface p-4 md:p-6">
          <ItemForm item={dish} categories={categories} />
          <ImageManager dishId={dish.id} dishName={name} images={dish.images} />
          <DeleteDish id={dish.id} name={name} photoCount={photoCount} />
        </div>
      ) : null}
    </li>
  );
}

function DeleteDish({ id, name, photoCount }: { id: number; name: string; photoCount: number }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border-t border-line pt-6">
      {confirming ? (
        <ActionForm action={deleteItem} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-body-sm text-ink">
            {format(photoCount === 0 ? t.dish.deleteConfirm : photoCount === 1 ? t.dish.deleteConfirmOnePhoto : t.dish.deleteConfirmPhotos, {
              name,
              count: photoCount,
            })}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton variant="danger" pendingLabel={t.dish.deleting} className="min-h-[3rem]">
              {t.dish.deleteYes}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-[3rem] rounded-hair border border-line-strong px-5 text-label-lg font-medium uppercase text-ink"
            >
              {t.dish.deleteKeep}
            </button>
          </div>
        </ActionForm>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="min-h-[2.75rem] text-label-lg font-medium uppercase text-critical">
          {t.dish.deleteDish}
        </button>
      )}
    </div>
  );
}
