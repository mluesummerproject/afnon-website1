import type { Metadata } from 'next';

import { CategoryManager } from '@/components/admin/CategoryManager';
import { getCategoryOverview } from '@/lib/admin-data';

export const metadata: Metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const { categories, error } = await getCategoryOverview();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">Categories</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
        In the order guests see them. Translate each category&rsquo;s name into Uzbek, Russian and English, or reorder the whole section.
      </p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <CategoryManager categories={categories} />
    </main>
  );
}
