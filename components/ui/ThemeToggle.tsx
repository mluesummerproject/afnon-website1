'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, themeColor, type Theme } from '@/lib/theme';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

const SPREAD_MS = 800;

function persist(theme: Theme) {
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure}`;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor[theme]);
}

/**
 * Sun in Classic, moon in Midnight. Tapping it spreads the other theme out
 * from the button as a growing circle over 0.8s, using the browser's own
 * view transition so nothing in the page has to animate its colours itself.
 *
 * Where view transitions are not supported, or the visitor asked for reduced
 * motion, the theme simply changes at once. Either way the choice is written
 * to a cookie, so the next page load is rendered in it from the server.
 *
 * Styling is passed in: the public header and the staff header draw icon
 * buttons differently, and this should look native in both.
 */
export function ThemeToggle({
  initial,
  labels,
  className,
}: {
  initial: Theme;
  labels: { toMidnight: string; toClassic: string };
  className: string;
}) {
  const [theme, setTheme] = useState<Theme>(initial);
  const button = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  // The other half of the site may have changed it since this was rendered.
  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'classic' || current === 'midnight') setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'midnight' ? 'classic' : 'midnight';
    const doc = document as ViewTransitionDocument;

    if (!doc.startViewTransition || reduce) {
      setTheme(next);
      persist(next);
      return;
    }

    const rect = button.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
      persist(next);
    });

    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: SPREAD_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  };

  const midnight = theme === 'midnight';

  return (
    <button
      ref={button}
      type="button"
      onClick={toggle}
      aria-label={midnight ? labels.toClassic : labels.toMidnight}
      title={midnight ? labels.toClassic : labels.toMidnight}
      className={className}
    >
      {midnight ? <MoonIcon size={19} /> : <SunIcon size={19} />}
    </button>
  );
}
