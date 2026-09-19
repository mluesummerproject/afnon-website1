import type { Metadata } from 'next';

import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { localeMeta } from '@/lib/i18n';
import { brand } from '@/lib/site';

/**
 * Titled for a bookmark or a home-screen icon: short, in the panel's language,
 * with the manifest and Apple tags that make "Add to Home Screen" open the
 * panel full screen at /admin, like an app.
 */
export function generateMetadata(): Metadata {
  const { dict } = getAdminLocaleAndDict();
  return {
    title: { absolute: `${brand.name} — ${dict.login.subtitle}` },
    applicationName: dict.shell.appName,
    manifest: '/admin/manifest.webmanifest',
    appleWebApp: { capable: true, title: dict.shell.appName, statusBarStyle: 'default' },
    robots: { index: false, follow: false },
  };
}

/** The admin is always live data — never served from a cache. */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = getAdminLocaleAndDict();
  return (
    <div lang={localeMeta[locale].htmlLang} className="admin-shell min-h-[100svh] bg-paper">
      <span className="sr-only">{dict.shell.appName}</span>
      {children}
    </div>
  );
}
