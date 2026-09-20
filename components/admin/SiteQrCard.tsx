'use client';

import { useT } from '@/components/admin/AdminLangProvider';
import { QrDownloads } from '@/components/admin/QrDownloads';
import { SiteQr } from '@/components/admin/TableQr';

/**
 * One general QR code that opens the homepage — not tied to any table — for
 * posters, flyers and the window. It sits in Settings, with the same two
 * downloads as every table's code.
 */
export function SiteQrCard() {
  const t = useT();
  return (
    <section aria-labelledby="site-qr" className="mt-12 border-t border-line-strong pt-8">
      <h2 id="site-qr" className="font-display text-display-sm text-ink">
        {t.qr.siteTitle}
      </h2>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">{t.qr.siteHint}</p>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="w-fit rounded-hair border border-line bg-white p-3 transition-shadow duration-base ease-brand hover:shadow-panel">
          <SiteQr size={176} />
        </div>
        <div className="min-w-0">
          <QrDownloads path="/" name="afnon-website" />
          <p className="mt-4 max-w-measure border-l-2 border-anor/40 bg-anor-tint/40 px-4 py-3 text-body-sm text-ink">{t.tables.domainWarning}</p>
        </div>
      </div>
    </section>
  );
}
