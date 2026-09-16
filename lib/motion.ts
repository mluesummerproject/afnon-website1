import type { Transition } from 'framer-motion';

/**
 * Afnon's motion language — one family of curves and durations.
 *
 *   ease       settles: long, soft landing. Text, images coming to rest.
 *   curtain    wipes: symmetrical and decisive. Masks, apertures, panels.
 *
 * Transform and opacity only. Reduced-motion users get the end state without
 * travel (MotionConfig reducedMotion="user" in MotionProvider).
 */
export const ease = [0.22, 1, 0.36, 1] as const;
export const curtain = [0.76, 0, 0.24, 1] as const;

export const duration = {
  quick: 0.32,
  base: 0.72,
  slow: 1.1,
  cinematic: 1.6,
} as const;

export const transition: Transition = { duration: duration.base, ease };

export const viewportOnce = { once: true, amount: 0.25 } as const;
