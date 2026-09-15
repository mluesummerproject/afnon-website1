import Link from 'next/link';

import { logout } from '@/app/admin/actions';
import { Disclosure } from '@/components/admin/Disclosure';
import { ItemForm } from '@/components/admin/ItemForm';
import { ItemRow } from '@/components/admin/ItemRow';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { AnorMark } from '@/components/ui/AnorMark';
import { groupByCategory, sortForAdmin } from '@/lib/menu';
import { brand } from '@/lib/site';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import type { MenuItem } from '@/lib/types';

const flashes: Record<string, string> = {
  created: 'Dish added to the menu.',
  saved: 'Changes saved.',
  deleted: 'Dish deleted.',
  available: 'Marked available.',
  unavailable: 'Marked unavailable — it now shows as unavailable on the public menu.',
  reordered: 'Order updated.',
  error: 'Something went wrong. Nothing was changed.',
};

async function loadItems(): Promise<{ items: MenuItem[]; error?: string }> {
  if (!isAdminSupabaseConfigured) {
    return {
      items: [],
      error:
        'SUPABASE_SERVICE_ROLE_KEY is not set on the server, so the menu cannot be read or edited here.',
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, category, name, description, price, image_url, is_available, sort_order');

    if (error) return { items: [], error: `Supabase said: ${error.message}` };
    return { items: sortForAdmin((data ?? []) as MenuItem[]) };
  } catch {
    return { items: [], error: 'Could not reach Supabase with the admin credentials.' };
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { m?: string };
}) {
  const { items, error } = await loadItems();
  const categories = groupByCategory(items);
  const categoryNames = categories.map((category) => category.name);
  const unavailableCount = items.filter((item) => item.is_available === false).length;
  const flash = searchParams?.m ? flashes[searchParams.m] : undefined;
  const isError = searchParams?.m === 'error';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <AnorMark className="h-5 w-auto self-center text-anor" />
            <span className="font-display text-[1.375rem] leading-none text-ink">{brand.name}</span>
            <span className="label hidden text-ink-muted sm:block">Menu manager</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="link-underline label hidden text-ink-secondary sm:block"
            >
              View site
            </Link>
            <form action={logout}>
              <SubmitButton variant="secondary" pendingLabel="…">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="shell py-8 md:py-12">
        <h1 className="sr-only">Menu manager</h1>

        {flash ? (
          <p
            role="status"
            className={`mb-6 border-l-2 px-4 py-3 text-body-sm ${
              isError ? 'border-critical text-critical' : 'border-positive text-ink'
            } bg-surface`}
          >
            {flash}
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mb-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
            {error}
          </p>
        ) : null}

        {/* At-a-glance answer to "what is on the menu right now?" */}
        <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-5">
          {[
            { label: 'Dishes', value: items.length },
            { label: 'Categories', value: categories.length },
            { label: 'Unavailable', value: unavailableCount },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-3">
              <dt className="label text-ink-muted">{stat.label}</dt>
              <dd className="figures font-display text-display-sm text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <Disclosure
          className="mt-8"
          summaryClassName="w-fit bg-anor px-5 text-paper hover:bg-anor-deep"
          summary={
            <>
              <span className="group-open:hidden">+&nbsp;&nbsp;Add a new dish</span>
              <span className="hidden group-open:inline">Close</span>
            </>
          }
        >
          <div className="mt-5 border-l-2 border-anor bg-surface p-4 md:p-6">
            <h2 className="font-display text-display-sm text-ink">New dish</h2>
            <p className="mt-1 text-body-sm text-ink-secondary">
              It is added to the end of its category. Use the arrows afterwards to move it.
            </p>
            <div className="mt-6">
              <ItemForm categories={categoryNames} />
            </div>
          </div>
        </Disclosure>

        {items.length === 0 && !error ? (
          <div className="mt-12 border-t border-line pt-10">
            <h2 className="font-display text-display-md text-ink">The menu is empty.</h2>
            <p className="mt-3 max-w-measure text-body text-ink-secondary">
              Add your first dish with the button above. As soon as you save it, it appears on the
              public menu.
            </p>
          </div>
        ) : null}

        <div className="mt-12 space-y-14">
          {categories.map((category) => (
            <section key={category.slug} aria-labelledby={`admin-${category.slug}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-3">
                <h2 id={`admin-${category.slug}`} className="font-display text-display-md text-ink">
                  {category.name}
                </h2>
                <p className="figures label text-ink-muted">
                  {category.items.length} {category.items.length === 1 ? 'dish' : 'dishes'}
                </p>
              </div>

              <ul>
                {category.items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categories={categoryNames}
                    position={index + 1}
                    isFirst={index === 0}
                    isLast={index === category.items.length - 1}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
