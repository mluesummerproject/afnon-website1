import { AdminMenu } from '@/components/admin/AdminMenu';
import { getAdminMenu } from '@/lib/admin-data';
import { groupByCategory } from '@/lib/ordering';

export default async function AdminMenuPage() {
  const { dishes, error } = await getAdminMenu();
  const categories = groupByCategory(dishes).map((group) => group.name);

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">Menu</h1>
      <p className="mt-1 text-body-sm text-ink-secondary">In the order guests see it. Changes go live as soon as they are saved.</p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <AdminMenu dishes={dishes} categories={categories} />
    </main>
  );
}
