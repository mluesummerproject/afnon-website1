import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateTableForm } from '@/components/admin/CreateTableForm';
import { TableRow } from '@/components/admin/TableRow';
import { getTables } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';

export const metadata: Metadata = { title: 'Tables' };

export default async function TablesPage() {
  const { tables, error } = await getTables();
  const t = getAdminDict();
  const hasActive = tables.some((table) => table.is_active !== false);

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.tables.title}</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">{t.tables.subtitle}</p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="add-table" className="mt-6 border-l-2 border-anor bg-surface p-4 md:p-6">
        <h2 id="add-table" className="font-display text-display-sm text-ink">
          {t.tables.createHeading}
        </h2>
        <div className="mt-4">
          <CreateTableForm />
        </div>
      </section>

      <p className="mt-6 border-l-2 border-anor/40 bg-anor-tint/40 px-4 py-3 text-body-sm text-ink">{t.tables.domainWarning}</p>

      <section aria-labelledby="table-list" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-strong pb-3">
          <h2 id="table-list" className="font-display text-display-sm text-ink">
            {t.tables.listHeading}
          </h2>
          {hasActive ? (
            <Link href="/admin/tables/print" target="_blank" className="link-underline label text-ink-secondary">
              {t.tables.printAll}
            </Link>
          ) : null}
        </div>

        {tables.length === 0 ? (
          <p className="mt-6 text-body-sm text-ink-secondary">{t.tables.empty}</p>
        ) : (
          <ul>
            {tables.map((table) => (
              <TableRow key={table.id} table={table} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
