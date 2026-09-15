import type { ReactNode } from 'react';

type DisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
  open?: boolean;
};

/**
 * Native <details>, so expand/collapse needs no JavaScript and stays keyboard
 * and screen-reader correct by default.
 */
export function Disclosure({
  summary,
  children,
  className = '',
  summaryClassName = '',
  open = false,
}: DisclosureProps) {
  return (
    <details className={`group ${className}`} open={open}>
      <summary
        className={`flex min-h-[2.75rem] cursor-pointer list-none items-center gap-2 rounded-hair text-label-lg font-medium uppercase [&::-webkit-details-marker]:hidden ${summaryClassName}`}
      >
        {summary}
      </summary>
      {children}
    </details>
  );
}
