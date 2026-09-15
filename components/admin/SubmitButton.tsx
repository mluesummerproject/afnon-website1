'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  title?: string;
  'aria-label'?: string;
};

const variants = {
  primary: 'bg-anor text-paper hover:bg-anor-deep',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink',
  danger: 'bg-critical text-paper hover:brightness-90',
  ghost: 'border border-line text-ink-secondary hover:border-ink hover:text-ink',
} as const;

/** Every admin submit shows its own pending state — staff never double-click blind. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  className = '',
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-hair px-4 text-label-lg font-medium uppercase transition-colors duration-quick ease-brand disabled:opacity-60 ${variants[variant]} ${className}`}
      {...rest}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
