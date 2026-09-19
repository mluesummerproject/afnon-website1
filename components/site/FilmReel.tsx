'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { format } from '@/lib/i18n';
import { ease } from '@/lib/motion';

type Film = { id: number; url: string; title: string };

type Labels = {
  region: string;
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
  previous: string;
  next: string;
  select: string;
  position: string;
  unsupported: string;
};

/**
 * A curated reel, not a media grid: one dominant frame and a typeset index.
 *
 * Playback discipline:
 *  · exactly one <video> carries a source — the active film — and it gets
 *    that source only once the section is near the viewport
 *  · muted autoplay only while at least a third of the frame is on screen,
 *    the tab is visible, reduced motion is off and Data Saver is off
 *  · leaving the viewport pauses; a visitor's own pause is always respected
 */
export function FilmReel({ films, labels }: { films: Film[]; labels: Labels }) {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(false);

  const film = films[active];
  const total = films.length;

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setCanAutoplay(!reduceMotion && !connection?.saveData);
  }, [reduceMotion]);

  // Two observers' worth of state from one: "near" loads, "visible" plays.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const nearObserver = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '300px 0px' });
    const visibleObserver = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= 0.35), { threshold: [0, 0.35, 0.7] });
    nearObserver.observe(frame);
    visibleObserver.observe(frame);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, active]);

  // The single place that decides whether the active film should be playing.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !near) return;
    const shouldPlay = visible && canAutoplay && !userPaused && !document.hidden && !failed;
    if (shouldPlay) {
      video.play().catch(() => setPlaying(false));
    } else if (!video.paused && !visible) {
      video.pause();
    }
  }, [visible, near, active, userPaused, canAutoplay, failed]);

  const select = useCallback(
    (next: number) => {
      const bounded = ((next % total) + total) % total;
      if (bounded === active) return;
      progressRefs.current.forEach((bar) => bar && (bar.style.transform = 'scaleX(0)'));
      setFailed(false);
      setPlaying(false);
      setActive(bounded);
    },
    [active, total],
  );

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => setPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  // Horizontal swipe on the frame changes film; vertical movement is left to the page.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    pointer.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || total < 2) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6) select(active + (dx < 0 ? 1 : -1));
  };

  return (
    <div role="region" aria-label={labels.region} className={`mt-3 grid gap-3 ${total > 1 ? 'md:grid-cols-2 md:gap-6' : 'mx-auto max-w-[26rem]'}`}>
      <div>
        <div
          ref={frameRef}
          className="relative mx-auto aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-[14px] bg-night md:max-h-[78vh]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointer.current = null)}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={film.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease }}
            >
              <video
                ref={videoRef}
                className={`h-full w-full object-cover transition-opacity duration-slow ${playing ? 'opacity-100' : 'opacity-70'}`}
                src={near ? film.url : undefined}
                preload={near ? 'metadata' : 'none'}
                muted
                loop
                playsInline
                disablePictureInPicture
                aria-label={film.title}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setFailed(true)}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  const bar = progressRefs.current[active];
                  if (bar && video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
                }}
              />
            </motion.div>
          </AnimatePresence>


          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-16 md:px-5 md:pb-4">
            {failed ? <p className="mb-3 text-[13px] text-white">{labels.unsupported}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <IconButton label={playing ? labels.pause : labels.play} onClick={togglePlay}>
                  {playing ? <PauseGlyph /> : <PlayGlyph />}
                </IconButton>
                <IconButton label={muted ? labels.soundOn : labels.soundOff} pressed={!muted} onClick={() => setMuted((value) => !value)}>
                  <SoundGlyph muted={muted} />
                </IconButton>
              </div>
              {total > 1 ? (
                <div className="flex items-center gap-1">
                  <IconButton label={labels.previous} onClick={() => select(active - 1)}>
                    <ChevronGlyph direction="left" />
                  </IconButton>
                  <span className="min-w-[3rem] text-center text-[13px] font-semibold tabular-nums text-white" aria-live="polite">
                    {format(labels.position, { index: active + 1, total })}
                  </span>
                  <IconButton label={labels.next} onClick={() => select(active + 1)}>
                    <ChevronGlyph direction="right" />
                  </IconButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="md:self-center">
        <ol className="divide-y divide-line overflow-hidden rounded-[14px] bg-card shadow-card">
          {films.map((item, position) => {
            const current = position === active;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select(position)}
                  aria-current={current ? 'true' : undefined}
                  aria-label={format(labels.select, { index: position + 1, title: item.title })}
                  className="tap group relative flex min-h-[3.5rem] w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`text-[13px] font-semibold tabular-nums ${current ? 'text-accent' : 'text-ink/60'}`}>
                    {String(position + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-dish-name transition-colors duration-150 ${current ? 'text-ink' : 'text-ink/70 group-hover:text-ink'}`}
                  >
                    {item.title}
                  </span>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                    <span
                      ref={(element) => {
                        progressRefs.current[position] = element;
                      }}
                      className={`block h-0.5 w-full origin-left bg-accent transition-transform duration-300 ease-linear ${current ? '' : 'opacity-0'}`}
                      style={{ transform: 'scaleX(0)' }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="tap flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function PlayGlyph() {
  return (
    <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
      <path d="M0 0L12 7L0 14Z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
      <rect width="4" height="14" />
      <rect x="8" width="4" height="14" />
    </svg>
  );
}

function SoundGlyph({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 5H4L8 1.5V12.5L4 9H1Z" fill="currentColor" stroke="none" />
      {muted ? <path d="M11.5 4.5L16.5 9.5M16.5 4.5L11.5 9.5" /> : <path d="M11 4C12.2 5.2 12.2 8.8 11 10M13.5 2C15.9 4.4 15.9 9.6 13.5 12" />}
    </svg>
  );
}

function ChevronGlyph({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path d={direction === 'left' ? 'M7 1L1 7L7 13' : 'M1 1L7 7L1 13'} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
