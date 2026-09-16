'use client';

import { useCallback, useRef } from 'react';

import { saveItem } from '@/app/admin/actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { SubmitButton } from '@/components/admin/SubmitButton';
import type { ActionResult } from '@/lib/admin-types';
import type { MenuItem } from '@/lib/types';

type ItemFormProps = {
  /** Omitted for a new dish. */
  item?: MenuItem;
  categories: string[];
  onCreated?: (id: number) => void;
};

const languages = [
  { code: 'uz', label: 'O‘zbekcha', note: 'main' },
  { code: 'ru', label: 'Русский', note: '' },
  { code: 'en', label: 'English', note: '' },
] as const;

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
        <legend className="label mb-1 text-ink-muted">Dish name</legend>
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
        <p className="text-micro text-ink-muted">Fill at least the Uzbek name. Visitors who choose Russian or English see Uzbek wherever a translation is empty.</p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-category`}>Category</Label>
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
          <p className="mt-1.5 text-micro text-ink-muted">Pick one, or type a new name to create it.</p>
        </div>
        <div>
          <Label htmlFor={`${uid}-price`}>Price</Label>
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
          <p className="mt-1.5 text-micro text-ink-muted">Numbers only is best — the website adds spacing and the currency.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-old-price`}>Old price</Label>
          <input
            id={`${uid}-old-price`}
            name="old_price"
            inputMode="numeric"
            maxLength={40}
            defaultValue={item?.old_price ?? ''}
            placeholder="e.g. 65000"
            className="field figures mt-2 border-line-strong"
            autoComplete="off"
          />
          <p className="mt-1.5 text-micro text-ink-muted">Leave empty for no discount. Only shown, struck through, when it is genuinely higher than the price above.</p>
        </div>
        <div>
          <Label htmlFor={`${uid}-badge`}>Badge</Label>
          <input
            id={`${uid}-badge`}
            name="badge"
            maxLength={16}
            defaultValue={item?.badge ?? ''}
            placeholder="e.g. Yangi, Hit"
            className="field mt-2 border-line-strong"
            autoComplete="off"
          />
          <p className="mt-1.5 text-micro text-ink-muted">A short word shown as a small ribbon on the dish. Leave empty for none.</p>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="label mb-1 text-ink-muted">Description (optional)</legend>
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
        Available today
      </label>

      <details className="group rounded-hair border border-line">
        <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center px-4 text-body-sm text-ink-secondary [&::-webkit-details-marker]:hidden">
          Advanced — outside image link
        </summary>
        <div className="px-4 pb-4">
          <Label htmlFor={`${uid}-image`}>Image link</Label>
          <input
            id={`${uid}-image`}
            name="image_url"
            type="text"
            inputMode="url"
            defaultValue={item?.image_url ?? ''}
            placeholder="https://…"
            className="field mt-2 border-line-strong"
          />
          <p className="mt-1.5 text-micro text-ink-muted">Only used when the dish has no uploaded photos. Uploading below is easier.</p>
        </div>
      </details>

      <SubmitButton pendingLabel="Saving…" className="min-h-[3.25rem] w-full md:w-auto">
        {item ? 'Save changes' : 'Add dish to menu'}
      </SubmitButton>
    </ActionForm>
  );
}
