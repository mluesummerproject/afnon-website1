'use client';

import { useState } from 'react';

import { StarIcon } from '@/components/ui/icons';

type StarRatingProps = {
  /** 0 = unrated. */
  value: number;
  onChange: (value: number) => void;
  size?: number;
  labelFor: (star: number) => string;
  disabled?: boolean;
};

/**
 * A tappable 5-star control, shared by table feedback and dish ratings. Press
 * feedback reuses the site's existing burst/pulse primitive (`.heart-burst` /
 * `.heart-pulse`, from the favourite button) rather than a new animation —
 * the CSS is a generic accent-tinted scale burst, not literally heart-shaped.
 */
export function StarRating({ value, onChange, size = 32, labelFor, disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [burst, setBurst] = useState(0);
  const shown = hover || value;

  return (
    <div role="radiogroup" className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= shown;
        const isChosen = star === value;
        return (
          <button
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
            className="tap hit-44 relative flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            style={{ width: size, height: size }}
          >
            {isChosen && burst > 0 ? <span key={burst} className="heart-pulse" aria-hidden="true" /> : null}
            <span className={`relative ${isChosen && burst > 0 ? 'heart-burst' : ''}`}>
              <StarIcon size={size * 0.68} filled={filled} className={filled ? 'text-accent' : 'text-ink/25'} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
