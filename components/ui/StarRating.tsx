'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

import { StarIcon } from '@/components/ui/icons';

type StarRatingProps = {
  /** 0 = unrated. */
  value: number;
  onChange: (value: number) => void;
  size?: number;
  labelFor: (star: number) => string;
  disabled?: boolean;
  /** One brand seed (the shape the intro scatters) lifts off the star you tap. */
  seed?: boolean;
};

/**
 * A tappable 5-star control, shared by table feedback and dish ratings.
 *  · The press is a spring (framer-motion whileTap), the family the sheets use.
 *  · The chosen star settles with the site's existing burst/pulse primitive
 *    (`.heart-burst` / `.heart-pulse`, from the favourite button).
 *  · Optionally a seed drifts up and fades; reduced motion gets no travel.
 */
export function StarRating({ value, onChange, size = 32, labelFor, disabled = false, seed = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [burst, setBurst] = useState(0);
  const reduce = useReducedMotion();
  const shown = hover || value;

  return (
    <div role="radiogroup" className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= shown;
        const isChosen = star === value;
        return (
          <motion.button
            key={star}
            type="button"
            role="radio"
            aria-checked={isChosen}
            aria-label={labelFor(star)}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => {
              onChange(star);
              setBurst((count) => count + 1);
            }}
            whileTap={reduce ? undefined : { scale: 0.82 }}
            transition={{ type: 'spring', stiffness: 520, damping: 22 }}
            className="hit-44 relative flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            style={{ width: size, height: size }}
          >
            {isChosen && burst > 0 ? <span key={burst} className="heart-pulse" aria-hidden="true" /> : null}
            {seed && isChosen && burst > 0 && !reduce ? (
              <motion.svg
                key={`seed-${burst}`}
                aria-hidden="true"
                viewBox="0 0 10 13"
                className="pointer-events-none absolute left-1/2 top-0 h-3.5 w-[11px] -translate-x-1/2 text-accent"
                initial={{ y: 0, opacity: 0.95, rotate: -20, scale: 0.7 }}
                animate={{ y: -(size * 0.7), opacity: 0, rotate: 24, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" fill="currentColor" />
              </motion.svg>
            ) : null}
            <span className={`relative ${isChosen && burst > 0 ? 'heart-burst' : ''}`}>
              <StarIcon size={size * 0.68} filled={filled} className={filled ? 'text-accent' : 'text-ink/25'} />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
