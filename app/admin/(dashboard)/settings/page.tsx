import type { Metadata } from 'next';

import { SettingsForm } from '@/components/admin/SettingsForm';
import { SiteQrCard } from '@/components/admin/SiteQrCard';
import { getStoredSettings } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';

export const metadata: Metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const { settings, error } = await getStoredSettings();
  const t = getAdminDict();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.settings.title}</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">{t.settings.subtitle}</p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <SettingsForm settings={settings} />

      <SiteQrCard />
    </main>
  );
}
