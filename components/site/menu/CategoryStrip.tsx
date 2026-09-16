'use client';

import { animate, LayoutGroup, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

type CategoryStripProps = {
  categories: { slug: string; label: string }[];
  active: string;
  onSelect: (slug: string) => void;
  label: string;
};

type Ripple = { key: number; slug: string; x: number; y: number };

/**
 * Sticky category pills.
 * · One shared indicator (Framer layoutId) slides and resizes between pills.
 * · The strip drags with momentum and rubber-bands at both ends (any input),
 *   and follows horizontal trackpad / shift-wheel scrolling.
 * · A tap springs the pill (0.94 → 1.04 → 1) and ripples from the touch point.
 * · The active pill is kept in view as the page scrolls.
 */
export function CategoryStrip({ categories, active, onSelect, label }: CategoryStripProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const pills = useRef(new Map<string, HTMLButtonElement>());
  const x = useMotionValue(0);
  const [minX, setMinX] = useState(0);
  const dragged = useRef(false);
  const reduce = useReducedMotion();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [trail, setTrail] = useState<{ left: number; width: number } | null>(null);

  // A brief accent trail behind the sliding indicator — lags the real one by measuring
  // the active pill's own box (not layoutId, so it persists as one element between switches).
  useEffect(() => {
    const pill = pills.current.get(active);
    if (pill) setTrail({ left: pill.offsetLeft, width: pill.offsetWidth });
  }, [active, categories]);

  const measure = useCallback(() => {
    const available = viewport.current?.clientWidth ?? 0;
    const content = row.current?.scrollWidth ?? 0;
    const next = Math.min(0, available - content);
    setMinX(next);
    if (x.get() < next) x.set(next);
  }, [x]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (row.current) observer.observe(row.current);
    return () => observer.disconnect();
  }, [measure, categories]);

  const clamp = useCallback((value: number) => Math.max(minX, Math.min(0, value)), [minX]);

  const bringIntoView = useCallback(
    (slug: string) => {
      const pill = pills.current.get(slug);
      const width = viewport.current?.clientWidth;
      if (!pill || !width || dragged.current) return;
      const target = clamp(-(pill.offsetLeft - (width - pill.offsetWidth) / 2));
      if (reduce) x.set(target);
      else animate(x, target, { type: 'spring', stiffness: 320, damping: 36 });
    },
    [clamp, reduce, x],
  );

  useEffect(() => {
    bringIntoView(active);
  }, [active, minX, bringIntoView]);

  const onWheel = (event: React.WheelEvent) => {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!horizontal && !event.shiftKey) return;
    x.set(clamp(x.get() - (horizontal ? event.deltaX : event.deltaY)));
  };

  const select = (event: React.MouseEvent<HTMLButtonElement>, slug: string) => {
    if (dragged.current) return;
    const pill = event.currentTarget;
    if (!reduce) {
      const box = pill.getBoundingClientRect();
      const pointX = event.clientX ? event.clientX - box.left : box.width / 2;
      const pointY = event.clientY ? event.clientY - box.top : box.height / 2;
      setRipples((current) => [...current.slice(-4), { key: Date.now() + Math.random(), slug, x: pointX, y: pointY }]);
      animate(pill, { scale: [1, 0.94, 1.04, 1] }, { duration: 0.28, times: [0, 0.3, 0.7, 1], ease: 'easeOut' });
    }
    onSelect(slug);
  };

  return (
    <nav aria-label={label} className="sticky top-14 z-30 border-b border-line bg-page">
      <div ref={viewport} className="overflow-hidden" onWheel={onWheel}>
        <motion.div
          ref={row}
          className="relative flex w-max gap-2 px-4 py-2 md:px-6"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: minX, right: 0 }}
          dragElastic={0.16}
          dragMomentum
          dragTransition={{ power: 0.35, timeConstant: 240, bounceStiffness: 420, bounceDamping: 34 }}
          onDragStart={() => {
            dragged.current = true;
          }}
          onDragEnd={() => {
            window.setTimeout(() => {
              dragged.current = false;
            }, 80);
          }}
        >
          {trail && !reduce ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-2 rounded-[18px] bg-accent/25 blur-[2px]"
              animate={{ left: trail.left, width: trail.width }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ) : null}
          <LayoutGroup id="category-strip">
            {categories.map((category) => {
              const isActive = category.slug === active;
              return (
                <motion.button
                  key={category.slug}
                  ref={(element: HTMLButtonElement | null) => {
                    if (element) pills.current.set(category.slug, element);
                    else pills.current.delete(category.slug);
                  }}
                  type="button"
                  data-slug={category.slug}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => select(event, category.slug)}
                  onFocus={() => bringIntoView(category.slug)}
                  className={`hit-44 relative flex h-9 shrink-0 items-center whitespace-nowrap rounded-[18px] px-4 text-tab transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="category-indicator"
                      className="absolute inset-0 rounded-[18px] bg-accent"
                      style={{ borderRadius: 18 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
                    />
                  ) : null}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
                    {ripples
                      .filter((ripple) => ripple.slug === category.slug)
                      .map((ripple) => (
                        <span
                          key={ripple.key}
                          className={`ripple ${isActive ? 'ripple-light' : ''}`}
                          style={{ left: ripple.x, top: ripple.y }}
                          onAnimationEnd={() => setRipples((current) => current.filter((entry) => entry.key !== ripple.key))}
                        />
                      ))}
                  </span>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      data-intro-target="category"
                      className="relative mr-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-white"
                    />
                  ) : null}
                  <span className="relative">{category.label}</span>
                </motion.button>
              );
            })}
          </LayoutGroup>
        </motion.div>
      </div>
    </nav>
  );
}
