import { deleteItem, moveItem, toggleAvailability } from '@/app/admin/actions';
import { Disclosure } from '@/components/admin/Disclosure';
import { ItemForm } from '@/components/admin/ItemForm';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { formatPrice } from '@/lib/menu';
import type { MenuItem } from '@/lib/types';

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded-hair border border-line text-ink-secondary transition-colors duration-quick hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-30';

function MoveForm({
  id,
  direction,
  disabled,
}: {
  id: number;
  direction: 'up' | 'down';
  disabled: boolean;
}) {
  return (
    <form action={moveItem}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        className={iconButton}
        aria-label={direction === 'up' ? 'Move up' : 'Move down'}
      >
        <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
          <path
            d={direction === 'up' ? 'M1 6L5.5 1L10 6' : 'M1 1L5.5 6L10 1'}
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      </button>
    </form>
  );
}

export function ItemRow({
  item,
  categories,
  isFirst,
  isLast,
  position,
}: {
  item: MenuItem;
  categories: string[];
  isFirst: boolean;
  isLast: boolean;
  position: number;
}) {
  const unavailable = item.is_available === false;
  const price = formatPrice(item.price);

  return (
    <li className="border-t border-line">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 py-4 md:flex-nowrap">
        <div className="flex items-center gap-1 pt-0.5">
          <span className="figures label w-6 text-ink-muted">{position}</span>
          <MoveForm id={item.id} direction="up" disabled={isFirst} />
          <MoveForm id={item.id} direction="down" disabled={isLast} />
        </div>

        <div className="min-w-0 flex-1 basis-full md:basis-auto">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`font-display text-display-sm ${unavailable ? 'text-ink-muted line-through decoration-1' : 'text-ink'}`}>
              {item.name?.trim() || 'Untitled dish'}
            </span>
            {unavailable ? (
              <span className="label rounded-hair bg-critical/10 px-2 py-1 text-critical">
                Unavailable
              </span>
            ) : null}
            {item.image_url ? <span className="label text-ink-muted">Has photo</span> : null}
          </p>
          {item.description ? (
            <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
              {item.description}
            </p>
          ) : (
            <p className="mt-1 text-micro text-ink-muted">No description</p>
          )}
        </div>

        <p className="figures w-24 shrink-0 pt-1 text-body-sm text-ink md:text-right">
          {price ?? <span className="text-ink-muted">No price</span>}
        </p>

        <form action={toggleAvailability} className="shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="next" value={unavailable ? 'true' : 'false'} />
          <SubmitButton variant="ghost" pendingLabel="…">
            {unavailable ? 'Mark available' : 'Mark unavailable'}
          </SubmitButton>
        </form>
      </div>

      {/* Edit panel — a native disclosure, so it needs no JavaScript to open. */}
      <Disclosure
        className="pb-4"
        summaryClassName="ml-auto w-fit border border-line-strong px-4 text-ink hover:border-ink"
        summary={
          <>
            <span className="group-open:hidden">Edit</span>
            <span className="hidden group-open:inline">Close editor</span>
          </>
        }
      >
        <div className="mt-4 border-l-2 border-line-strong bg-surface p-4 md:p-5">
          <ItemForm item={item} categories={categories} />

          <details className="mt-6 border-t border-line pt-5">
            <summary className="flex min-h-[2.75rem] w-fit cursor-pointer list-none items-center text-label-lg font-medium uppercase text-critical [&::-webkit-details-marker]:hidden">
              Delete this dish
            </summary>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="text-body-sm text-ink-secondary">
                This removes “{item.name?.trim() || 'this dish'}” permanently. It cannot be undone.
              </p>
              <form action={deleteItem}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitButton variant="danger" pendingLabel="Deleting…">
                  Yes, delete
                </SubmitButton>
              </form>
            </div>
          </details>
        </div>
      </Disclosure>
    </li>
  );
}
