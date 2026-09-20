'use client';

import { useState } from 'react';

import { useT } from '@/components/admin/AdminLangProvider';
import { downloadQrPng, downloadQrSvg } from '@/components/admin/qr-download';
import { toast } from '@/components/admin/toast';
import { DownloadIcon } from '@/components/ui/icons';

/**
 * Two downloads for one QR code: a 1200px PNG and a vector SVG. Each button
 * shows a brief working state, and the panel's own toast confirms the file
 * (or says plainly that it could not be made).
 */
export function QrDownloads({ path, name }: { path: string; name: string }) {
  const t = useT();
  const [busy, setBusy] = useState<'png' | 'svg' | null>(null);

  const run = async (kind: 'png' | 'svg') => {
    if (busy) return;
    setBusy(kind);
    try {
      await (kind === 'png' ? downloadQrPng(path, name) : downloadQrSvg(path, name));
      toast({ ok: true, message: t.qr.downloaded });
    } catch {
      toast({ ok: false, message: t.qr.failed });
    } finally {
      setBusy(null);
    }
  };

  const button = 'inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-hair border border-line-strong bg-surface px-4 text-label-lg font-medium uppercase text-ink hover:border-anor/50 disabled:cursor-wait disabled:opacity-60';

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      <button type="button" disabled={busy !== null} aria-busy={busy === 'png'} aria-label={t.qr.png} title={t.qr.png} onClick={() => void run('png')} className={button}>
        <DownloadIcon size={16} />
        {busy === 'png' ? t.qr.working : 'PNG'}
      </button>
      <button type="button" disabled={busy !== null} aria-busy={busy === 'svg'} aria-label={t.qr.svg} title={t.qr.svgHint} onClick={() => void run('svg')} className={button}>
        <DownloadIcon size={16} />
        {busy === 'svg' ? t.qr.working : 'SVG'}
      </button>
    </div>
  );
}
