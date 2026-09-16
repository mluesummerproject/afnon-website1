'use client';

import { useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { format, type Dictionary } from '@/lib/i18n';
import { isOptimizableImage } from '@/lib/menu-format';
import type { Banner } from '@/lib/types';

/**
 * Promo banners: native swipe with scroll-snap, dot pagination, auto-advance
 * every 6s that pauses on any interaction (and for 8s after it), while
 * off-screen or in a background tab, and never runs with reduced motion.
 * First banner eager for LCP, the rest lazy.
 */
export function BannerCarousel({ banners, labels }: { banners: Banner[]; labels: Dictionary['banners'] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lastInteraction = useRef(0);
  const hovering = useRef(false);
  const reduce = useReducedMotion();
  const total = banners.length;

  const slideLeft = (position: number) => {
    const element = rail.current;
    const slide = element?.children[position] as HTMLElement | undefined;
    if (!element || !slide) return 0;
    return slide.offsetLeft - parseFloat(getComputedStyle(element).paddingLeft || '0');
  };

  const go = useCallback(
    (position: number) => {
      const element = rail.current;
      if (!element) return;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 4;
      const target = position >= total || (atEnd && position > index) ? 0 : position;
      element.scrollTo({ left: slideLeft(target), behavior: reduce ? 'auto' : 'smooth' });
    },
    [total, index, reduce],
  );

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const first = element.children[0] as HTMLElement | undefined;
        const step = first ? first.offsetWidth + 12 : element.clientWidth;
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="pt-3"
      onPointerDown={interact}
      onFocusCapture={interact}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <div
        ref={rail}
        onTouchStart={interact}
        onWheel={interact}
        className="no-scrollbar mx-auto flex max-w-[75rem] snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 md:scroll-px-6 md:px-6"
      >
        {banners.map((banner, position) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={format(labels.slide, { index: position + 1, total })}
            className="relative aspect-video w-full shrink-0 snap-start overflow-hidden rounded-[14px] bg-placeholder md:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]"
          >
            <Image
              src={banner.image_url}
              alt={banner.title ?? ''}
              fill
              priority={position === 0}
              loading={position === 0 ? undefined : 'lazy'}
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              unoptimized={!isOptimizableImage(banner.image_url)}
            />
            {banner.title ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 text-[14px] font-semibold text-white">
                {banner.title}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {total > 1 ? (
        <div className="mt-0.5 flex justify-center">
          {banners.map((banner, position) => (
            <button
              key={`dot-${banner.id}`}
              type="button"
              aria-label={format(labels.goTo, { index: position + 1 })}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => {
                interact();
                rail.current?.scrollTo({ left: slideLeft(position), behavior: reduce ? 'auto' : 'smooth' });
              }}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all duration-200 ${position === index ? 'w-5 bg-accent' : 'w-2 bg-ink/20'}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
