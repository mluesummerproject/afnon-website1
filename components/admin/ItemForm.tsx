'use client';

import { useCallback, useRef } from 'react';

import { saveItem } from '@/app/admin/actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { useT } from '@/components/admin/AdminLangProvider';
import { SubmitButton } from '@/components/admin/SubmitButton';
import type { ActionResult } from '@/lib/admin-types';
import type { MenuItem } from '@/lib/types';

type ItemFormProps = {
  /** Omitted for a new dish. */
  item?: MenuItem;
  categories: string[];
  onCreated?: (id: number) => void;
};

function Label({ htmlFor, children, note }: { htmlFor: string; children: React.ReactNode; note?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-body-sm font-medium text-ink">
      {children}
      {note ? <span className="label text-ink-muted">{note}</span> : null}
    </label>
  );
}

/**
 * One form for adding and editing. Single column on a phone with 16px fields
 * (no zoom on focus), languages clearly labelled, one big save button.
 */
export function ItemForm({ item, categories, onCreated }: ItemFormProps) {
  const t = useT();
  const languages = [
    { code: 'uz', label: t.form.uz, note: t.form.main },
    { code: 'ru', label: t.form.ru, note: '' },
    { code: 'en', label: t.form.en, note: '' },
  ] as const;
  const formRef = useRef<HTMLFormElement>(null);
  const uid = item ? `dish-${item.id}` : 'dish-new';

  // A dish entered before translations existed only has `name`; show it as the Uzbek name.
  const legacyOnly = item && !item.name_uz && !item.name_ru && !item.name_en;
  const defaults = {
    name_uz: item?.name_uz ?? (legacyOnly ? item?.name ?? '' : ''),
    name_ru: item?.name_ru ?? '',
    name_en: item?.name_en ?? '',
    description_uz: item?.description_uz ?? (legacyOnly ? item?.description ?? '' : ''),
    description_ru: item?.description_ru ?? '',
    description_en: item?.description_en ?? '',
  };

  const onResult = useCallback(
    (result: NonNullable<ActionResult>) => {
      if (result.ok && !item) {
        formRef.current?.reset();
        if (result.id) onCreated?.(result.id);
      }
    },
    [item, onCreated],
  );

  return (
    <ActionForm action={saveItem} formRef={formRef} onResult={onResult} className="space-y-7">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <fieldset className="space-y-4">
        <legend className="label mb-1 text-ink-muted">{t.form.nameLegend}</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {languages.map((language) => (
            <div key={language.code}>
              <Label htmlFor={`${uid}-name-${language.code}`} note={language.note}>
                {language.label}
              </Label>
              <input
                id={`${uid}-name-${language.code}`}
                name={`name_${language.code}`}
                lang={language.code}
                maxLength={120}
                defaultValue={defaults[`name_${language.code}`]}
                className="field mt-2 border-line-strong"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
        <p className="text-micro text-ink-muted">{t.form.nameHint}</p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-category`}>{t.form.category}</Label>
          <input
            id={`${uid}-category`}
            name="category"
            list={`${uid}-categories`}
            maxLength={80}
            defaultValue={item?.category ?? ''}
            className="field mt-2 border-line-strong"
            autoComplete="off"
          />
          <datalist id={`${uid}-categories`}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <p className="mt-1.5 text-micro text-ink-muted">{t.form.categoryHint}</p>
        </div>
        <div>
          <Label htmlFor={`${uid}-price`}>{t.form.price}</Label>
          <input
            id={`${uid}-price`}
            name="price"
            inputMode="numeric"
            maxLength={40}
            defaultValue={item?.price ?? ''}
            placeholder="45000"
            className="field figures mt-2 border-line-strong"
            autoComplete="off"
          />
          <p className="mt-1.5 text-micro text-ink-muted">{t.form.priceHint}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-old-price`}>{t.form.oldPrice}</Label>
          <input
            id={`${uid}-old-price`}
            name="old_price"
            inputMode="numeric"
            maxLength={40}
            defaultValue={item?.old_price ?? ''}
            placeholder={t.form.oldPricePlaceholder}
            className="field figures mt-2 border-line-strong"
            autoComplete="off"
          />
          <p className="mt-1.5 text-micro text-ink-muted">{t.form.oldPriceHint}</p>
        </div>
        <div>
          <Label htmlFor={`${uid}-badge`}>{t.form.badge}</Label>
          <input
            id={`${uid}-badge`}
            name="badge"
            maxLength={16}
            defaultValue={item?.badge ?? ''}
            placeholder={t.form.badgePlaceholder}
            className="field mt-2 border-line-strong"
            autoComplete="off"
          />
          <p className="mt-1.5 text-micro text-ink-muted">{t.form.badgeHint}</p>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="label mb-1 text-ink-muted">{t.form.descriptionLegend}</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {languages.map((language) => (
            <div key={language.code}>
              <Label htmlFor={`${uid}-description-${language.code}`}>{language.label}</Label>
              <textarea
                id={`${uid}-description-${language.code}`}
                name={`description_${language.code}`}
                lang={language.code}
                rows={3}
                maxLength={600}
                defaultValue={defaults[`description_${language.code}`]}
                className="field mt-2 border-line-strong"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-hair border border-line-strong bg-paper px-4 text-body text-ink">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={item ? item.is_available !== false : true}
          className="h-6 w-6 accent-[rgb(var(--anor))]"
        />
        {t.form.available}
      </label>

      <details className="group rounded-hair border border-line">
        <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center px-4 text-body-sm text-ink-secondary [&::-webkit-details-marker]:hidden">
          {t.form.advanced}
        </summary>
        <div className="px-4 pb-4">
          <Label htmlFor={`${uid}-image`}>{t.form.imageLink}</Label>
          <input
            id={`${uid}-image`}
            name="image_url"
            type="text"
            inputMode="url"
            defaultValue={item?.image_url ?? ''}
            placeholder="https://…"
            className="field mt-2 border-line-strong"
          />
          <p className="mt-1.5 text-micro text-ink-muted">{t.form.imageHint}</p>
        </div>
      </details>

      <SubmitButton pendingLabel={t.form.saving} savedLabel={t.toast.savedShort} className="min-h-[3.25rem] w-full md:w-auto">
        {item ? t.form.save : t.form.add}
      </SubmitButton>
    </ActionForm>
  );
}
