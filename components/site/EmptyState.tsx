import type { ReactNode } from 'react';

import { AnorMark } from '@/components/ui/AnorMark';

type Kind = 'basket' | 'search' | 'menu';

/** A small, quiet line illustration with one line of text — never a bare "nothing here". */
export function EmptyState({ kind, text, children }: { kind: Kind; text: string; children?: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center px-6 py-10 text-center">
      {/* The house mark, outline only, as a watermark: brand presence without competing with the illustration. */}
      <AnorMark outline className="pointer-events-none absolute left-1/2 top-4 h-28 w-auto -translate-x-1/2 text-accent opacity-[0.07]" />
      <svg aria-hidden="true" width="96" height="72" viewBox="0 0 96 72" fill="none" className="relative text-accent">
        <ellipse cx="48" cy="62" rx="30" ry="5" fill="currentColor" opacity="0.06" />
        {kind === 'basket' ? (
          <>
            <path d="M24 30h48l-5 26a4 4 0 0 1-4 3H33a4 4 0 0 1-4-3Z" stroke="currentColor" strokeWidth="2" opacity="0.55" />
            <path d="M38 30v-4a10 10 0 0 1 20 0v4" stroke="currentColor" strokeWidth="2" opacity="0.35" />
          </>
        ) : null}
        {kind === 'search' ? (
          <>
            <circle cx="43" cy="34" r="16" stroke="currentColor" strokeWidth="2" opacity="0.55" />
            <path d="m55 46 12 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
            <path d="M37 34h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
          </>
        ) : null}
        {kind === 'menu' ? (
          <>
            <path d="M20 44h56a28 28 0 0 1-56 0Z" stroke="currentColor" strokeWidth="2" opacity="0.55" transform="translate(0 -6)" />
            <path d="M40 22c0-4 4-4 4-8M50 22c0-4 4-4 4-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
          </>
        ) : null}
      </svg>
      <p className="relative mt-3 text-[15px] text-ink/70">{text}</p>
      {children}
    </div>
  );
}
