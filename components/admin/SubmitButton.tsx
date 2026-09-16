'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  className?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
};

const variants = {
  primary: 'bg-anor px-5 text-paper hover:bg-anor-hover active:bg-anor-deep',
  secondary: 'border border-line-strong bg-surface px-4 text-ink hover:border-ink',
  danger: 'bg-critical px-5 text-paper hover:brightness-90',
  ghost: 'border border-line px-4 text-ink-secondary hover:border-ink hover:text-ink',
  icon: 'w-11 border border-line bg-surface text-ink-secondary hover:border-ink hover:text-ink',
} as const;

/** Every admin submit shows its own pending state and cannot be double-submitted. */
export function SubmitButton({ children, pendingLabel, variant = 'primary', className = '', disabled = false, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-hair text-label-lg font-medium uppercase transition-colors duration-quick ease-brand disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
