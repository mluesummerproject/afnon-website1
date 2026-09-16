import { AdminMenu } from '@/components/admin/AdminMenu';
import { getAdminMenu } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';
import { groupByCategory } from '@/lib/ordering';

export default async function AdminMenuPage() {
  const { dishes, error } = await getAdminMenu();
  const categories = groupByCategory(dishes).map((group) => group.name);
  const t = getAdminDict();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.menu.title}</h1>
      <p className="mt-1 text-body-sm text-ink-secondary">{t.menu.subtitle}</p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <AdminMenu dishes={dishes} categories={categories} />
    </main>
  );
}
