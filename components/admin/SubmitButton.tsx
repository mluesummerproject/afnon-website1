'use client';

import { useContext, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { SavedContext } from '@/components/admin/ActionForm';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  className?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  onClick?: () => void;
  /** Opt in to the third visible state: after a successful save the button briefly reads this, with a tick. */
  savedLabel?: string;
};

const variants = {
  primary: 'bg-anor px-5 text-paper hover:bg-anor-hover active:bg-anor-deep',
  secondary: 'border border-line-strong bg-surface px-4 text-ink hover:border-ink',
  danger: 'bg-critical px-5 text-paper hover:brightness-90',
  ghost: 'border border-line px-4 text-ink-secondary hover:border-ink hover:text-ink',
  icon: 'w-11 border border-line bg-surface text-ink-secondary hover:border-ink hover:text-ink',
} as const;

const savedVariants = {
  primary: 'bg-positive px-5 text-paper',
  secondary: 'border border-positive bg-positive/10 px-4 text-positive',
  ghost: 'border border-positive bg-positive/10 px-4 text-positive',
  danger: 'bg-critical px-5 text-paper',
  icon: 'w-11 border border-line bg-surface text-ink-secondary',
} as const;

/**
 * Every admin submit shows its own pending state and cannot be double-submitted.
 * A save button can also opt in (`savedLabel`) to the last of three visible
 * states — idle → saving → saved — so staff never wonder whether it worked.
 */
export function SubmitButton({ children, pendingLabel, variant = 'primary', className = '', disabled = false, savedLabel, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const savedAt = useContext(SavedContext);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!savedAt || !savedLabel) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 1800);
    return () => window.clearTimeout(timer);
  }, [savedAt, savedLabel]);

  const saved = flash && !pending && Boolean(savedLabel);

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`tap inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-hair text-label-lg font-medium uppercase transition-colors duration-quick ease-brand disabled:cursor-not-allowed disabled:opacity-40 ${saved ? savedVariants[variant] : variants[variant]} ${className}`}
      {...rest}
    >
      {saved ? (
        <>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {savedLabel}
        </>
      ) : pending && pendingLabel ? (
        pendingLabel
      ) : (
        children
      )}
    </button>
  );
}
