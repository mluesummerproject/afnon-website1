'use client';

import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/admin/SubmitButton';
import { login, type FormState } from '@/app/admin/actions';

const initialState: FormState = null;

export function LoginForm({ notice, labels }: { notice?: string; labels: { password: string; signIn: string; checking: string } }) {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <form action={formAction} className="mt-8">
      {notice ? (
        <p className="mb-5 border-l-2 border-line-strong bg-surface px-4 py-3 text-body-sm text-ink-secondary">
          {notice}
        </p>
      ) : null}

      <label htmlFor="password" className="label block text-ink-muted">
        {labels.password}
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-describedby={state?.error ? 'password-error' : undefined}
        className="mt-3 min-h-[3rem] w-full rounded-hair border border-line-strong bg-surface px-4 text-body text-ink outline-none transition-colors duration-quick focus:border-anor"
      />

      {state?.error ? (
        <p id="password-error" role="alert" className="mt-3 text-body-sm text-critical">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel={labels.checking} className="mt-6 w-full">
        {labels.signIn}
      </SubmitButton>
    </form>
  );
}
