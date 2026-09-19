'use client';

import { useEffect, useState } from 'react';

import { deleteTable, setTableActive } from '@/app/admin/table-actions';
import { useT } from '@/components/admin/AdminLangProvider';
import { TableQr, tableUrl } from '@/components/admin/TableQr';
import { toast } from '@/components/admin/toast';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { format } from '@/lib/i18n';
import type { RestaurantTable } from '@/lib/types';

export function TableRow({ table }: { table: RestaurantTable }) {
  const t = useT();
  const [pending, run] = useAdminAction();
  const [confirming, setConfirming] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const active = table.is_active !== false;

  // Arriving from a feedback entry (/admin/tables#table-{id}) lights this row up for a moment. CSS :target
  // does not update on Next's client-side navigations, so the URL hash is read here instead.
  useEffect(() => {
    let timer = 0;
    const check = () => {
      if (window.location.hash !== `#table-${table.id}`) return;
      setHighlighted(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHighlighted(false), 2600);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => {
      window.removeEventListener('hashchange', check);
      window.clearTimeout(timer);
    };
  }, [table.id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl(table.token));
      toast({ ok: true, message: t.tables.linkCopied });
    } catch {
      toast({ ok: false, message: t.toast.generic });
    }
  };

  return (
    <li id={`table-${table.id}`} className={`-mx-3 flex scroll-mt-40 flex-col gap-4 rounded-hair border-b border-line px-3 py-5 transition-colors duration-base ${highlighted ? 'bg-anor-tint' : 'hover:bg-surface'} sm:flex-row sm:items-center`}>
      <div className="flex shrink-0 items-center justify-center rounded-hair border border-line bg-paper p-2">
        <TableQr token={table.token} size={88} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-display-sm text-ink">{table.table_number}</h2>
          <span className={`label rounded-hair px-2 py-1 ${active ? 'bg-positive/15 text-positive' : 'bg-paper-alt text-ink-muted'}`}>
            {active ? t.tables.active : t.tables.inactive}
          </span>
        </div>
        <p className="mt-1 break-all text-micro text-ink-muted">/t/{table.token}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <button type="button" onClick={() => void copyLink()} className="tap min-h-[2.75rem] rounded-hair border border-line-strong bg-surface px-4 text-label-lg font-medium uppercase text-ink hover:border-anor/50">
          {t.tables.copyLink}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void run(() => setTableActive(table.id, !active))}
          className={`tap min-h-[2.75rem] rounded-hair border px-4 text-label-lg font-medium uppercase disabled:opacity-50 ${
            active ? 'border-line-strong bg-surface text-ink' : 'border-anor bg-anor text-paper'
          }`}
        >
          {active ? t.tables.deactivate : t.tables.activate}
        </button>
        {confirming ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void run(() => deleteTable(table.id)).then(() => setConfirming(false))}
              className="tap min-h-[2.75rem] rounded-hair bg-critical px-4 text-label-lg font-medium uppercase text-paper disabled:opacity-50"
            >
              {pending ? t.categories.removing : t.tables.deleteYes}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="tap min-h-[2.75rem] px-2 text-label-lg font-medium uppercase text-ink-secondary">
              {t.tables.deleteKeep}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={format(t.tables.deleteConfirm, { number: table.table_number })}
            className="tap min-h-[2.75rem] px-2 text-label-lg font-medium uppercase text-critical"
          >
            {t.tables.delete}
          </button>
        )}
      </div>
    </li>
  );
}
