'use client';

import { useCallback, useState } from 'react';

import { useT } from '@/components/admin/AdminLangProvider';
import { toast } from '@/components/admin/toast';
import type { ActionResult } from '@/lib/admin-types';

/** Runs an imperative admin Server Action with a pending flag and a toast. Ignores repeat taps while busy. */
export function useAdminAction(): [boolean, (run: () => Promise<ActionResult>) => Promise<ActionResult>] {
  const t = useT();
  const [pending, setPending] = useState(false);

  const execute = useCallback(
    async (run: () => Promise<ActionResult>) => {
      if (pending) return null;
      setPending(true);
      try {
        const result = await run();
        if (result) toast({ ok: result.ok, message: result.message });
        return result;
      } catch {
        toast({ ok: false, message: t.toast.generic });
        return null;
      } finally {
        setPending(false);
      }
    },
    [pending, t],
  );

  return [pending, execute];
}
