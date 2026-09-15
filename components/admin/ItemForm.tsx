'use client';

import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/admin/SubmitButton';
import { createItem, updateItem, type FormState } from '@/app/admin/actions';
import type { MenuItem } from '@/lib/types';

const initialState: FormState = null;

const fieldClass =
  'mt-2 w-full rounded-hair border border-line-strong bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors duration-quick focus:border-anor';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label block text-ink-muted">{label}</span>
      {children}
      {hint ? <p className="mt-1.5 text-micro text-ink-muted">{hint}</p> : null}
    </div>
  );
}

type ItemFormProps = {
  /** Omitted for a new dish. */
  item?: MenuItem;
  categories: string[];
  onCancelHref?: string;
};

export function ItemForm({ item, categories }: ItemFormProps) {
  const isEdit = Boolean(item);
  const [state, formAction] = useFormState(isEdit ? updateItem : createItem, initialState);
  const uid = isEdit ? `edit-${item!.id}` : 'new';

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {isEdit ? <input type="hidden" name="id" value={item!.id} /> : null}

      <Field label="Dish name">
        <label className="sr-only" htmlFor={`${uid}-name`}>
          Dish name
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          required
          maxLength={120}
          defaultValue={item?.name ?? ''}
          className={fieldClass}
        />
      </Field>

      <Field label="Category" hint="Type a new one to create it.">
        <label className="sr-only" htmlFor={`${uid}-category`}>
          Category
        </label>
        <input
          id={`${uid}-category`}
          name="category"
          required
          list={`${uid}-categories`}
          maxLength={80}
          defaultValue={item?.category ?? ''}
          className={fieldClass}
        />
        <datalist id={`${uid}-categories`}>
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Field>

      <Field label="Price" hint="Numbers get formatted automatically. Leave empty to show a dash.">
        <label className="sr-only" htmlFor={`${uid}-price`}>
          Price
        </label>
        <input
          id={`${uid}-price`}
          name="price"
          inputMode="decimal"
          maxLength={40}
          defaultValue={item?.price ?? ''}
          className={`figures ${fieldClass}`}
        />
      </Field>

      <Field label="Image link" hint="Optional. Must start with https:// or /.">
        <label className="sr-only" htmlFor={`${uid}-image`}>
          Image link
        </label>
        <input
          id={`${uid}-image`}
          name="image_url"
          type="text"
          inputMode="url"
          placeholder="https://…  or  /images/dish.jpg"
          defaultValue={item?.image_url ?? ''}
          className={fieldClass}
        />
      </Field>

      <div className="md:col-span-2">
        <Field label="Description" hint="One or two lines. Optional.">
          <label className="sr-only" htmlFor={`${uid}-description`}>
            Description
          </label>
          <textarea
            id={`${uid}-description`}
            name="description"
            rows={2}
            maxLength={400}
            defaultValue={item?.description ?? ''}
            className={fieldClass}
          />
        </Field>
      </div>

      {isEdit ? (
        <Field label="Position" hint="Lower numbers come first. Use the arrows for quick moves.">
          <label className="sr-only" htmlFor={`${uid}-sort`}>
            Position
          </label>
          <input
            id={`${uid}-sort`}
            name="sort_order"
            type="number"
            step={1}
            defaultValue={item?.sort_order ?? ''}
            className={`figures ${fieldClass} md:max-w-[8rem]`}
          />
        </Field>
      ) : null}

      <div className="flex items-end">
        <label className="flex min-h-[2.75rem] cursor-pointer items-center gap-3 text-body text-ink">
          <input
            type="checkbox"
            name="is_available"
            defaultChecked={item ? item.is_available !== false : true}
            className="h-5 w-5 accent-[rgb(var(--anor))]"
          />
          Available today
        </label>
      </div>

      <div className="md:col-span-2">
        {state?.error ? (
          <p role="alert" className="mb-4 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <SubmitButton pendingLabel="Saving…">
            {isEdit ? 'Save changes' : 'Add to menu'}
          </SubmitButton>
          <button
            type="reset"
            className="min-h-[2.75rem] rounded-hair border border-line px-4 text-label-lg font-medium uppercase text-ink-secondary transition-colors duration-quick hover:border-ink hover:text-ink"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}
