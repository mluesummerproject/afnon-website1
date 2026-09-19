'use client';

import { useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HEADER_HEIGHT, MENU_OFFSET, scrollToElement } from '@/lib/client-scroll';
import { format, type Dictionary } from '@/lib/i18n';
import { isOptimizableImage } from '@/lib/menu-format';

export type HeroSlide = {
  id: number;
  imageUrl: string;
  title: string | null;
  /** Resolved on the server; null when the banner is just a picture. */
  target: { kind: 'category'; elementId: string } | { kind: 'section'; elementId: string } | { kind: 'external'; href: string } | null;
};

/**
 * The hero itself: the pictures staff put in the Banners tab, one at a time,
 * full width.
 *
 * Behaviour is deliberately the same as the promo rail it grew out of —
 * scroll-snap for native swipe, auto-advance every 6s that stands down for 8s
 * after any interaction, while off-screen, in a background tab, or under
 * reduced motion. A slide with a target is a link; a slide without one is a
 * picture, and is not focusable or clickable.
 */
export function HeroCarousel({ slides, labels }: { slides: HeroSlide[]; labels: Dictionary['banners'] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lastInteraction = useRef(0);
  const hovering = useRef(false);
  const reduce = useReducedMotion();
  const total = slides.length;

  const slideLeft = (position: number) => {
    const element = rail.current;
    const slide = element?.children[position] as HTMLElement | undefined;
    return element && slide ? slide.offsetLeft - element.offsetLeft : 0;
  };

  const go = useCallback(
    (position: number) => {
      const element = rail.current;
      if (!element) return;
      element.scrollTo({ left: slideLeft(position % total), behavior: reduce ? 'auto' : 'smooth' });
    },
    [total, reduce],
  );

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const step = element.clientWidth || 1;
        setIndex(Math.min(total - 1, Math.max(0, Math.round(element.scrollLeft / step))));
      });
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [total]);

  useEffect(() => {
    if (reduce || total < 2) return;
    const timer = window.setInterval(() => {
      if (!visible || document.hidden || hovering.current) return;
      if (Date.now() - lastInteraction.current < 8000) return;
      go(index + 1);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reduce, total, visible, index, go]);

  const interact = () => {
    lastInteraction.current = Date.now();
  };

  const onTarget = (kind: 'category' | 'section', elementId: string) => {
    // A section (the Chef's picks) has no category strip above it; if it is not on the page right now
    // (a search is filtering the menu, say) the menu itself is the next best place.
    const target = document.getElementById(elementId) ?? (kind === 'section' ? document.getElementById('menu') : null);
    if (target) scrollToElement(target, kind === 'section' ? HEADER_HEIGHT + 8 : MENU_OFFSET);
  };

  return (
    <div
      aria-roledescription="carousel"
      aria-label={labels.region}
      onPointerDown={interact}
      onFocusCapture={interact}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <div
        ref={rail}
        onTouchStart={interact}
        onWheel={interact}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[18px] ring-1 ring-white/15"
      >
        {slides.map((slide, position) => {
          const media = (
            <>
              <Image
                src={slide.imageUrl}
                alt={slide.title ?? ''}
                fill
                priority={position === 0}
                loading={position === 0 ? undefined : 'lazy'}
                sizes="(min-width: 1024px) 1000px, 100vw"
                className="object-cover"
                unoptimized={!isOptimizableImage(slide.imageUrl)}
              />
              {slide.title ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-12 text-left text-[15px] font-semibold text-white md:px-5 md:pb-4 md:text-[17px]">
                  {slide.title}
                </span>
              ) : null}
            </>
          );

          // Capped rather than purely proportional: on a wide screen a 16:9
          // box that fills the column pushes the menu off the fold, which is
          // the complaint the old hero earned.
          const frame = 'relative aspect-[4/3] max-h-[52svh] w-full shrink-0 snap-start overflow-hidden bg-black/20 sm:aspect-[16/9] sm:max-h-[44svh]';

          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={format(labels.slide, { index: position + 1, total })}
              className="w-full shrink-0 snap-start"
            >
              {slide.target === null ? (
                <div className={frame}>{media}</div>
              ) : slide.target.kind === 'external' ? (
                <a href={slide.target.href} target="_blank" rel="noreferrer noopener" className={`${frame} tap block`}>
                  {media}
                </a>
              ) : (
                <button
                  type="button"
                  aria-label={slide.title ?? labels.viewPicks}
                  onClick={() => slide.target && slide.target.kind !== 'external' && onTarget(slide.target.kind, slide.target.elementId)}
                  className={`${frame} tap block cursor-pointer text-left`}
                >
                  {media}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {total > 1 ? (
        <div className="mt-1 flex justify-center">
          {slides.map((slide, position) => (
            <button
              key={`dot-${slide.id}`}
              type="button"
              aria-label={format(labels.goTo, { index: position + 1 })}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => {
                interact();
                rail.current?.scrollTo({ left: slideLeft(position), behavior: reduce ? 'auto' : 'smooth' });
              }}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all duration-200 ${position === index ? 'w-5 bg-white' : 'w-2 bg-white/40'}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
