'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * `reducedMotion="user"` makes every Framer Motion animation on the site honour
 * prefers-reduced-motion: transform and layout animations are skipped, opacity
 * is kept. Set once, here, so no component has to remember.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
