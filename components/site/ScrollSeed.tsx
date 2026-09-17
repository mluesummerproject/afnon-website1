'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Desktop-only scroll-progress marker: a single seed travels down the left
 * margin from the top of the page to the Manzil section, rotating slowly.
 * Once Manzil is reached it splits into two halves and fades — a quiet
 * "you've arrived" signal, not a functional control.
 */
export function ScrollSeed() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const visit = document.getElementById('visit');
      const target = visit ? visit.getBoundingClientRect().top + window.scrollY - 96 : document.documentElement.scrollHeight - window.innerHeight;
      const ratio = target > 0 ? window.scrollY / target : 0;
      setProgress(Math.max(0, Math.min(1, ratio)));
      setArrived(target > 0 && window.scrollY >= target - 4);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduce]);

  if (reduce) return null;

  const top = 12 + progress * 76; // vh — stays clear of the header and the very bottom edge
  const rotate = progress * 540;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-3 z-30 hidden -translate-y-1/2 lg:block"
      style={{ top: `${top}vh` }}
    >
      {arrived ? (
        <div className="relative h-3 w-3">
          <motion.span
            className="absolute inset-0 h-2.5 w-1.5 rounded-full bg-accent"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: -5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 h-2.5 w-1.5 rounded-full bg-accent"
            style={{ clipPath: 'inset(0 0 0 50%)' }}
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: 5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      ) : (
        <svg width="10" height="13" viewBox="0 0 10 13" className="text-accent-ink/70 transition-transform duration-200" style={{ transform: `rotate(${rotate}deg)` }}>
          <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
