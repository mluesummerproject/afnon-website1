'use client';

import { useCallback, useRef, type ReactNode, type RefObject } from 'react';
import { useFormState } from 'react-dom';

import { toast } from '@/components/admin/toast';
import type { ActionResult } from '@/lib/admin-types';

type ActionFormProps = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  formRef?: RefObject<HTMLFormElement>;
  onResult?: (result: NonNullable<ActionResult>) => void;
};

/**
 * Wraps a Server Action so every submit reports back in place: the submit
 * button shows its pending state (SubmitButton), the shared toaster shows the
 * outcome, and the page re-renders with fresh data without navigating away.
 *
 * The outcome is reported the moment the action resolves — not from an effect
 * after render — because a successful delete removes this very form from the
 * page, and an effect would never get the chance to run.
 */
export function ActionForm({ action, children, className, formRef, onResult }: ActionFormProps) {
  const latest = useRef(onResult);
  latest.current = onResult;

  const report = useCallback(
    async (previous: ActionResult, formData: FormData) => {
      const result = await action(previous, formData);
      if (result) {
        toast({ ok: result.ok, message: result.message });
        latest.current?.(result);
      }
      return result;
    },
    [action],
  );

  const [, formAction] = useFormState(report, null);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
    </form>
  );
}
