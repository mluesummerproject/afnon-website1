import type { Metadata } from 'next';

import { BannerManager } from '@/components/admin/BannerManager';
import { getAdminBanners, getAdminMenu } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';
import { groupByCategory } from '@/lib/ordering';

export const metadata: Metadata = { title: 'Banners' };

export default async function AdminBannersPage() {
  const [{ banners, error }, { dishes }] = await Promise.all([getAdminBanners(), getAdminMenu()]);
  const categories = groupByCategory(dishes).map((group) => group.name);
  const t = getAdminDict();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.banners.title}</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">{t.banners.subtitle}</p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <BannerManager banners={banners} categories={categories} />
    </main>
  );
}
