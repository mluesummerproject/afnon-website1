'use client';

import { useState } from 'react';

import { useT } from '@/components/admin/AdminLangProvider';
import { useAdminAction } from '@/components/admin/useAdminAction';
import type { ActionResult } from '@/lib/admin-types';

/**
 * A permanent delete that always asks first. One tap on "Delete" swaps the
 * button for the question and a Yes / Keep pair; only "Yes, delete" runs the
 * Server Action (which checks the staff session again on the server). The
 * result comes back through the panel's own toast, in the panel's language.
 */
export function DeleteRecord({ action, confirmText }: { action: () => Promise<ActionResult>; confirmText: string }) {
  const t = useT();
  const [pending, run] = useAdminAction();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="min-h-[2.75rem] rounded-hair px-3 text-label-lg font-medium uppercase text-critical hover:bg-critical/10">
        {t.records.delete}
      </button>
    );
  }

  return (
    <div role="group" aria-label={confirmText} className="w-full rounded-hair border border-critical/30 bg-critical/[0.04] p-3">
      <p className="text-body-sm text-ink">{confirmText}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          aria-busy={pending}
          onClick={() => void run(action).then((result) => (result?.ok ? undefined : setConfirming(false)))}
          className="min-h-[2.75rem] rounded-hair bg-critical px-4 text-label-lg font-medium uppercase text-paper disabled:opacity-50"
        >
          {pending ? t.records.deleting : t.records.deleteYes}
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-[2.75rem] rounded-hair border border-line-strong bg-surface px-4 text-label-lg font-medium uppercase text-ink disabled:opacity-50">
          {t.records.deleteKeep}
        </button>
      </div>
    </div>
  );
}
