import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion language. Transform and opacity only, one easing curve, one
 * set of durations — so every reveal on the site feels like the same hand.
 */
export const ease = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = { duration: 0.72, ease };
export const quickTransition: Transition = { duration: 0.32, ease };

/** Section reveal: a short rise, once, as the section enters. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition },
};

/** Staged children — used for the hero lines and gallery groups. */
export const stagger = (delayChildren = 0, staggerChildren = 0.09): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

export const viewportOnce = { once: true, amount: 0.25 } as const;
