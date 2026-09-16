import type { Metadata } from 'next';

import { SettingsForm } from '@/components/admin/SettingsForm';
import { getStoredSettings } from '@/lib/admin-data';

export const metadata: Metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const { settings, error } = await getStoredSettings();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">Settings</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
        Real business details shown across the website — the contact button, the Visit Us card and each dish&rsquo;s order link. Leave a
        field empty to show nothing rather than a guess.
      </p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <SettingsForm settings={settings} />
    </main>
  );
}
