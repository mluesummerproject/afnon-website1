import Image from 'next/image';

import { MenuEmpty, MenuError } from '@/components/site/MenuStates';
import { formatPrice, getMenu } from '@/lib/menu';
import type { MenuCategory, MenuItem } from '@/lib/types';

function MenuRow({ item, reserveImageColumn }: { item: MenuItem; reserveImageColumn: boolean }) {
  const price = formatPrice(item.price);
  const unavailable = item.is_available === false;
  const name = item.name?.trim() || 'Untitled dish';
  const description = item.description?.trim();

  return (
    <li
      className={`border-t border-line py-6 first:border-t-0 md:py-7 ${
        unavailable ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-start gap-5 md:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="font-display text-display-sm text-ink">{name}</h4>
            {unavailable ? (
              <span className="label rounded-hair border border-line-strong px-2 py-1 text-ink-muted">
                Unavailable
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-2 max-w-measure text-body-sm text-ink-secondary">{description}</p>
          ) : null}
        </div>

        {/* Fixed price column keeps every figure on one axis down the page. */}
        <p className="figures w-20 shrink-0 pt-1 text-right text-body-sm text-ink md:w-24">
          {price ?? <span className="text-ink-muted">—</span>}
        </p>

        {reserveImageColumn ? (
          <div className="hidden w-14 shrink-0 sm:block md:w-[4.5rem]">
            {item.image_url ? (
              <div className="relative aspect-square overflow-hidden bg-paper">
                <Image
                  src={item.image_url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                  unoptimized={!item.image_url.startsWith('/')}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Category({
  category,
  index,
  reserveImageColumn,
}: {
  category: MenuCategory;
  index: number;
  reserveImageColumn: boolean;
}) {
  return (
    <section
      id={`menu-${category.slug}`}
      aria-labelledby={`menu-${category.slug}-heading`}
      className="scroll-mt-28 pt-14 first:pt-0 md:pt-20"
    >
      <div className="flex items-baseline gap-5 border-t border-line-strong pt-5">
        <span className="figures label text-anor">{String(index + 1).padStart(2, '0')}</span>
        <h3
          id={`menu-${category.slug}-heading`}
          className="font-display text-display-md text-ink"
        >
          {category.name}
        </h3>
      </div>

      <ul className="mt-7">
        {category.items.map((item) => (
          <MenuRow key={item.id} item={item} reserveImageColumn={reserveImageColumn} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Reads the live menu on the server and renders it as a printed list.
 * Streamed behind a Suspense boundary by <Menu />.
 */
export async function MenuBoard() {
  const menu = await getMenu();

  if (menu.status === 'error') return <MenuError message={menu.message} />;
  if (menu.status === 'empty') return <MenuEmpty />;

  // One decision for the whole board: if the kitchen has added any photos at
  // all, every row reserves the plate column so the prices never shift axis.
  const reserveImageColumn = menu.categories.some((category) =>
    category.items.some((item) => item.image_url?.trim()),
  );

  return (
    <div>
      {menu.categories.map((category, index) => (
        <Category
          key={category.slug}
          category={category}
          index={index}
          reserveImageColumn={reserveImageColumn}
        />
      ))}
    </div>
  );
}

/** Category jump-list for the sticky column. Reads the same live data. */
export async function MenuIndex() {
  const menu = await getMenu();
  if (menu.status !== 'ok' || menu.categories.length < 2) return null;

  return (
    <nav aria-label="Menu categories" className="mt-10 border-t border-line pt-5">
      <ul className="flex flex-wrap gap-x-6 gap-y-3 lg:block">
        {menu.categories.map((category) => (
          <li key={category.slug} className="lg:border-b lg:border-line">
            <a
              href={`#menu-${category.slug}`}
              className="link-underline label inline-flex min-h-[2.75rem] items-center text-ink-muted transition-colors duration-base ease-brand hover:text-anor lg:min-h-0 lg:py-3"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
