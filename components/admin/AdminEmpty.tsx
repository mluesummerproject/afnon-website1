import type { ReactNode } from 'react';

import { AnorMark } from '@/components/ui/AnorMark';

/**
 * The staff panel's empty state: the house mark at low opacity, with the
 * panel's own warm copy underneath. Brand presence through the mark alone —
 * the admin stays calm and fast, with none of the customer site's ambience.
 */
export function AdminEmpty({ title, rule = false, children }: { title?: string; /** Draw a rule above — only where the page has no heading rule of its own. */ rule?: boolean; children: ReactNode }) {
  return (
    <div className={`mt-8 flex flex-col items-center px-2 pb-4 pt-8 text-center ${rule ? 'border-t border-line pt-10' : ''}`}>
      <AnorMark className="h-12 w-auto text-anor opacity-20" />
      {title ? <h2 className="mt-4 font-display text-display-sm text-ink">{title}</h2> : null}
      <p className={`max-w-measure text-body-sm text-ink-secondary ${title ? 'mt-2' : 'mt-4'}`}>{children}</p>
    </div>
  );
}
