'use client';

import { useEffect, useState } from 'react';

import { AnorMark } from '@/components/ui/AnorMark';

const DISMISSED_KEY = 'afnon_admin_homescreen_hint';

type Platform = 'ios' | 'android';

/**
 * A one-time tip on a phone: how to put the panel on the home screen so it
 * opens in one tap. Shown only on iPhone/iPad or Android, never once the panel
 * is already running from the home screen, and gone for good once hidden.
 * Decided after mount (it depends on the device), so the server renders nothing.
 */
export function HomeScreenHint({ labels }: { labels: { title: string; ios: string; android: string; dismiss: string } }) {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch {
      /* storage blocked — still show the tip; hiding just won't be remembered */
    }
    const agent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) setPlatform('ios');
    else if (/Android/.test(agent)) setPlatform('android');
  }, []);

  if (!platform) return null;

  const dismiss = () => {
    setPlatform(null);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="shell pt-4">
      <div role="note" className="flex animate-fade-rise items-start gap-3 border-l-2 border-anor bg-surface px-4 py-3">
        <AnorMark className="mt-0.5 h-5 w-auto shrink-0 text-anor" />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium text-ink">{labels.title}</p>
          <p className="mt-0.5 text-body-sm text-ink-secondary">{platform === 'ios' ? labels.ios : labels.android}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={labels.dismiss}
          className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted transition-colors hover:text-ink"
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
