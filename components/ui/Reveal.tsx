'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { ease, viewportOnce } from '@/lib/motion';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds. Use sparingly — staged, not theatrical. */
  delay?: number;
  /** Vertical travel in px. Kept small on purpose. */
  distance?: number;
};

/**
 * The site's single reveal primitive: a short rise into place, once.
 * Reduced-motion users get the opacity fade only (handled by MotionConfig).
 */
export function Reveal({ children, className, delay = 0, distance = 18 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.72, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
