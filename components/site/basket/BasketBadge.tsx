'use client';

import { useAnimate, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

import { useBasket } from '@/components/site/basket/BasketProvider';

/** Count badge: scale-bounces to 1.25 on every change; glows when the basket goes from empty to one. */
export function BasketBadge({ className = '' }: { className?: string }) {
  const { count, bump, glow, hydrated } = useBasket();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!bump || reduce || !scope.current) return;
    animate(scope.current, { scale: [1, 1.25, 1] }, { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] });
  }, [bump, reduce, animate, scope]);

  if (!hydrated || count === 0) return null;

  return (
    <span
      ref={scope}
      aria-hidden="true"
      className={`absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-white ring-2 ring-card ${className}`}
    >
      {glow > 0 ? <span key={glow} className="badge-glow" /> : null}
      <span className="relative tabular-nums">{count > 99 ? '99+' : count}</span>
    </span>
  );
}
