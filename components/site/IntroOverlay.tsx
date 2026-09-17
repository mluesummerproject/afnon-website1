'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** The brand seed colour, following the theme (Classic value as fallback). */
const INK = 'rgb(var(--anor-ink, 92 18 30))';

const SEEN_KEY = 'afnon_intro_seen';
const SEED_COUNT_WIDE = 16;
const SEED_COUNT_NARROW = 10;

/**
 * The four seeds that don't scatter away: they curve toward whichever of
 * these already exist on screen right now and settle there, so the overlay's
 * decorative copy fades out exactly where the real, permanent element is.
 * A target that isn't found (or is currently off-screen) is simply skipped —
 * that seed scatters and fades like the rest, rather than homing on nothing.
 */
const LANDING_SELECTORS = ['[data-intro-target="badge"]', '[data-basket-target]', '[data-intro-target="mark"]', '[data-intro-target="category"]'];

type Point = { x: number; y: number };

function measureLandings(): (Point | null)[] {
  if (typeof window === 'undefined') return LANDING_SELECTORS.map(() => null);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  return LANDING_SELECTORS.map((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) return null;
    return { x: rect.left + rect.width / 2 - cx, y: rect.top + rect.height / 2 - cy };
  });
}

type Seed = { angle: number; distance: number; scale: number; rotate: number; delay: number; opacity: number };

function makeSeeds(count: number): Seed[] {
  return Array.from({ length: count }, (_, index) => {
    // A wide arc left-to-right (not a symmetrical ring), each with its own scale/rotation/timing.
    const spread = -70 + (140 * index) / Math.max(1, count - 1);
    const jitter = (index % 3) * 6 - 6;
    return {
      angle: spread + jitter,
      distance: 46 + ((index * 37) % 30),
      scale: 0.6 + ((index * 53) % 80) / 100,
      rotate: ((index * 71) % 360) - 180,
      delay: (index * 27) % 200,
      opacity: 0.55 + ((index * 19) % 45) / 100,
    };
  });
}

/**
 * Plays once per session, decides everything on the client (so it can never
 * delay the server-rendered page or block LCP), and gets out of the way
 * instantly on any interaction. Under reduced motion, or on a device that
 * reports little horsepower, it never mounts at all.
 */
export function IntroOverlay() {
  const [phase, setPhase] = useState<'idle' | 'draw' | 'reveal' | 'done'>('idle');
  const [landings, setLandings] = useState<(Point | null)[]>(() => LANDING_SELECTORS.map(() => null));
  const reduce = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lowPower = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
    let seen = true;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === 'true';
    } catch {
      /* private mode / storage blocked — treat as already seen, never block */
    }
    if (reduce || lowPower || seen) {
      setPhase('done');
      return;
    }

    setPhase('draw');
    const t1 = window.setTimeout(() => {
      // The real page is already in the DOM underneath — measure its four
      // landing spots right as the aperture starts to open.
      setLandings(measureLandings());
      setPhase('reveal');
    }, 260);
    const t2 = window.setTimeout(() => finish(), 1500);

    function finish() {
      setPhase('done');
      try {
        sessionStorage.setItem(SEEN_KEY, 'true');
      } catch {
        /* ignore */
      }
    }

    const skip = () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      finish();
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchmove', skip, { once: true, passive: true });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'idle' || phase === 'done') return null;

  const narrow = typeof window !== 'undefined' && window.innerWidth < 430;
  const seeds = makeSeeds(narrow ? SEED_COUNT_NARROW : SEED_COUNT_WIDE);
  const revealing = phase === 'reveal';

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-page"
      initial={{ opacity: 1 }}
      animate={{ opacity: revealing ? 0 : 1 }}
      transition={{ duration: 0.45, delay: revealing ? 0.85 : 0, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        if (revealing) setPhase('done');
      }}
    >
      {/* Aperture: a circle that starts small around the mark and grows past the viewport. */}
      <motion.div
        className="absolute inset-0 bg-page"
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: revealing ? 'circle(140% at 50% 50%)' : 'circle(18% at 50% 50%)' }}
        transition={{ duration: revealing ? 0.85 : 0.3, ease: [0.76, 0, 0.24, 1] }}
      />

      {/*
        Explicit width/height/color, not `currentColor` + Tailwind sizing: this
        overlay is the very first thing painted, before any stylesheet is
        guaranteed to have applied, and it isn't nested in anything that would
        legitimately set its color — inheriting was fragile for no reason.
        The colour is the --anor-ink token with its Classic value as the
        fallback, so Midnight gets a seed that reads on a dark page and a
        stylesheet that has not landed yet still paints #5C121E.
      */}
      <motion.svg
        viewBox="0 0 24 28"
        width="69"
        height="80"
        className="relative"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: revealing ? 1.6 : 1, opacity: revealing ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <motion.path
          d="M1.5 27V12.4C1.5 6.6 6 1.9 12 0.8c6 1.1 10.5 5.8 10.5 11.6V27"
          style={{ stroke: INK }}
          strokeWidth="1.1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
        <motion.path
          d="M6.5 27V13.1c0-3.4 2.4-6.2 5.5-6.9 3.1.7 5.5 3.5 5.5 6.9V27"
          style={{ stroke: INK }}
          strokeWidth="1.1"
          fill="none"
          opacity="0.45"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut', delay: 0.06 }}
        />
        <motion.circle
          cx="12"
          cy="15.4"
          r="1.6"
          style={{ fill: INK }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut', delay: 0.22 }}
        />
      </motion.svg>

      {/* Seed scatter — small teardrops erupting from centre, most drifting off the right edge.
          Up to four (one per found landing spot) curve back inward instead and settle, rather
          than fading away, so the overlay's copy disappears right where the real element is. */}
      {revealing ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {seeds.map((seed, index) => {
            const scatterX = Math.cos((seed.angle * Math.PI) / 180) * seed.distance * 6;
            const scatterY = Math.sin((seed.angle * Math.PI) / 180) * seed.distance * 2.2;
            const landing = index < landings.length ? landings[index] : null;

            return (
              <motion.svg
                key={index}
                width="10"
                height="13"
                viewBox="0 0 10 13"
                className="absolute left-1/2 top-1/2"
                style={{ marginLeft: -5, marginTop: -6.5 }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                animate={
                  landing
                    ? {
                        x: [0, scatterX * 0.6, landing.x],
                        y: [0, scatterY * 0.6, landing.y],
                        opacity: [0, seed.opacity, 1],
                        scale: [0.3, seed.scale, 0.55],
                        rotate: [0, seed.rotate, seed.rotate * 0.35],
                      }
                    : { x: scatterX, y: scatterY, opacity: [0, seed.opacity, 0], scale: seed.scale, rotate: seed.rotate }
                }
                transition={
                  landing
                    ? { duration: 0.95, delay: seed.delay / 1000, times: [0, 0.5, 1], ease: ['easeOut', [0.34, 1.56, 0.64, 1]] }
                    : { duration: 0.85, delay: seed.delay / 1000, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" style={{ fill: INK }} />
              </motion.svg>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}
