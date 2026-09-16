'use client';

import { useReveal } from '@/components/ui/motion/useReveal';

/**
 * The heading every one of the five main sections shares: the text, then a
 * short accent rule that draws itself in as the section arrives. Visible by
 * default (see useReveal) — the draw is a bonus, never a gate.
 */
export function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  const ref = useReveal<HTMLHeadingElement>();
  return (
    <h2 id={id} ref={ref} className="reveal-heading text-section">
      {children}
      <span className="heading-rule" aria-hidden="true" />
    </h2>
  );
}
