import type { Metadata } from 'next';

import { BannerManager } from '@/components/admin/BannerManager';
import { getAdminBanners } from '@/lib/admin-data';

export const metadata: Metadata = { title: 'Banners' };

export default async function AdminBannersPage() {
  const { banners, error } = await getAdminBanners();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">Banners</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
        The promo carousel at the top of the website. All active banners rotate automatically, in this order.
      </p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <BannerManager banners={banners} />
    </main>
  );
}
