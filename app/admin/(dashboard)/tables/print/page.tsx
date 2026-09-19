import type { Metadata } from 'next';

import { TableQr } from '@/components/admin/TableQr';
import { AnorMark } from '@/components/ui/AnorMark';
import { getTables } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';

export const metadata: Metadata = { title: 'Print tables' };

/**
 * A clean A4 grid of every active table's QR code, meant for Ctrl+P → Save as
 * PDF — no PDF library involved. The invitation line is shown in all three
 * languages together (not just the admin's current one), because a printed
 * card serves every diner regardless of what language staff happen to be
 * working in today.
 */
const INVITATION = "Fikringizni qoldiring / Оставьте отзыв / Leave your feedback";

export default async function TablesPrintPage() {
  const { tables } = await getTables();
  const t = getAdminDict();
  const active = tables.filter((table) => table.is_active !== false);

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-display text-display-md text-ink">{t.tables.title}</h1>
        <p className="text-body-sm text-ink-secondary">{t.tables.domainWarning}</p>
      </div>

      {active.length === 0 ? (
        <p className="text-body-sm text-ink-secondary print:hidden">{t.tables.printNone}</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-3 print:gap-4">
          {active.map((table) => (
            <div key={table.id} className="print-card flex flex-col items-center gap-3 rounded-hair border border-line-strong bg-white p-5 text-center print:break-inside-avoid print:rounded-none print:border-ink/30">
              <AnorMark className="h-6 w-auto text-anor" />
              <p className="font-display text-display-sm text-ink">{table.table_number}</p>
              <TableQr token={table.token} size={168} />
              <p className="text-micro leading-snug text-ink-secondary">{INVITATION}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .print-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
