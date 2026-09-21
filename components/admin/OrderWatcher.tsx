'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getOrderSignal, type LiveOrder } from '@/app/admin/live-actions';
import { useT } from '@/components/admin/AdminLangProvider';
import { toast } from '@/components/admin/toast';
import { BellIcon } from '@/components/ui/icons';
import { format } from '@/lib/i18n';

/** Staff panel polls this often. Short enough to feel live, long enough to be free. */
const POLL_MS = 7000;
const SOUND_KEY = 'afnon_admin_order_sound';

/** A short two-note chime, made with the Web Audio API so no sound file is shipped. */
function chime(context: AudioContext) {
  const start = context.currentTime + 0.02;
  [
    { frequency: 880, at: 0 },
    { frequency: 1174.66, at: 0.16 },
  ].forEach(({ frequency, at }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(0.28, start + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.34);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start + at);
    oscillator.stop(start + at + 0.36);
  });
}

function describe(fresh: LiveOrder[], t: ReturnType<typeof useT>): string {
  if (fresh.length > 1) return format(t.live.newOrders, { count: fresh.length });
  const order = fresh[0];
  return order.type === 'table' && order.table ? format(t.live.newAtTable, { number: order.table }) : format(t.live.newOrder, { code: order.code });
}

/**
 * Staff-only, and only ever mounted inside the signed-in dashboard: every few
 * seconds it asks the server for orders newer than the last one it saw. A new
 * one plays a chime (unless muted), raises a toast that names the table, and
 * refreshes the page's data so the list and the tab badge are current.
 *
 * Browsers only allow sound after the person has touched the page, so the
 * audio is unlocked by the first tap or key press — staff have always done one
 * by the time they are signed in. The bell button mutes the chime; it never
 * hides orders. The choice is remembered on this device.
 */
export function OrderWatcher() {
  const router = useRouter();
  const t = useT();
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  const lastSeen = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SOUND_KEY);
      if (stored === 'off') {
        setSoundOn(false);
        soundRef.current = false;
      }
    } catch {
      /* storage blocked — the chime simply stays on for this visit */
    }
  }, []);

  const unlock = useCallback(() => {
    try {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return null;
      audio.current ??= new Context();
      if (audio.current.state === 'suspended') void audio.current.resume();
      return audio.current;
    } catch {
      return null;
    }
  }, []);

  // The first touch anywhere on the page unlocks sound for the rest of the visit.
  useEffect(() => {
    const events = ['pointerdown', 'keydown'] as const;
    const once = () => {
      unlock();
      events.forEach((name) => window.removeEventListener(name, once));
    };
    events.forEach((name) => window.addEventListener(name, once, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, once));
  }, [unlock]);

  const poll = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const signal = await getOrderSignal(lastSeen.current);
      if (!signal.signedIn) {
        router.refresh(); // the session ended: the layout sends the tab to the sign-in page
        return;
      }
      const first = lastSeen.current === null;
      lastSeen.current = Math.max(lastSeen.current ?? 0, signal.maxId);
      if (first || signal.fresh.length === 0) return;

      if (soundRef.current) {
        const context = unlock();
        if (context && context.state === 'running') chime(context);
      }
      toast({ ok: true, message: describe(signal.fresh, t), action: { label: t.live.open, run: () => router.push('/admin/orders') } });
      router.refresh();
    } catch {
      /* a dropped connection or a deploy in progress: the next tick tries again */
    } finally {
      busy.current = false;
    }
  }, [router, t, unlock]);

  useEffect(() => {
    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [poll]);

  const toggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundRef.current = next;
    try {
      window.localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
    } catch {
      /* storage blocked */
    }
    // Turning it on plays the chime once, so staff hear what to expect (and this tap unlocks the audio).
    if (next) {
      const context = unlock();
      if (context) chime(context);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={soundOn}
      aria-label={soundOn ? t.live.soundOn : t.live.soundOff}
      title={soundOn ? t.live.soundOn : t.live.soundOff}
      className={`tap flex h-11 w-11 shrink-0 items-center justify-center rounded-hair border transition-colors duration-quick ${
        soundOn ? 'border-anor/30 bg-anor-tint text-anor' : 'border-line-strong bg-surface text-ink-muted hover:text-ink'
      }`}
    >
      <BellIcon size={19} muted={!soundOn} />
    </button>
  );
}
