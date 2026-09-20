'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getDishComments, submitDishReview, type ReviewFailure } from '@/app/actions/rating';
import type { Dictionary, Locale } from '@/lib/i18n';
import { isDeviceId, type PublicComment, type ReasonKey } from '@/lib/ratings';
import type { Dish, DishRating } from '@/lib/types';

const DEVICE_KEY = 'afnon_device_id';
const MINE_KEY = 'afnon_my_ratings_v1';

export type RatingCopy = Dictionary['rating'];

export type ReviewDraft = {
  stars: number;
  reasons: ReasonKey[];
  text: string;
  name: string;
  phone: string;
  /** Honeypot value — always empty for a real guest. */
  company: string;
};

export type SubmitOutcome = { ok: true; commentFailed: boolean; hadComment: boolean } | { ok: false; reason: ReviewFailure };

export type CommentsState = { status: 'loading' | 'ok' | 'error'; list: PublicComment[] };

/** A random id for this browser only. Never personal; it lives in localStorage and nowhere else. */
let memoryDeviceId: string | null = null;

function newDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Created on the first review, then kept. If storage is blocked it lasts for this page visit only. */
function getDeviceId(): string {
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    if (isDeviceId(stored)) return stored;
    const fresh = newDeviceId();
    window.localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    memoryDeviceId ??= newDeviceId();
    return memoryDeviceId;
  }
}

function readMine(): Record<number, number> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(MINE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    const mine: Record<number, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isSafeInteger(id) && id > 0 && Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5) mine[id] = value as number;
    }
    return mine;
  } catch {
    return {};
  }
}

type RatingsContextValue = {
  copy: RatingCopy;
  locale: Locale;
  /** False until the comments SQL has been run: dishes then show the star rating only. */
  commentsEnabled: boolean;
  /** The freshest known summary: what this visit just changed, else what the server rendered. */
  summaryFor: (dish: Pick<Dish, 'id' | 'rating'>) => DishRating | null;
  /** This device's own stars for a dish (0 = not rated by this device). */
  mineFor: (dishId: number) => number;
  commentsFor: (dishId: number) => CommentsState | undefined;
  loadComments: (dishId: number) => void;
  submit: (dishId: number, draft: ReviewDraft) => Promise<SubmitOutcome>;
};

const RatingsContext = createContext<RatingsContextValue | null>(null);

export function useRatings(): RatingsContextValue {
  const context = useContext(RatingsContext);
  if (!context) throw new Error('useRatings must be used inside RatingsProvider');
  return context;
}

/**
 * Client-side state for dish reviews: this device's own stars (so a returning
 * guest sees theirs pre-selected), the freshest average/count after a review
 * so the card and the sheet update at once, and the comments already loaded.
 * The numbers themselves always come from the server — this never averages
 * anything.
 */
export function RatingsProvider({
  copy,
  locale,
  commentsEnabled,
  formToken,
  children,
}: {
  copy: RatingCopy;
  locale: Locale;
  commentsEnabled: boolean;
  formToken: string;
  children: ReactNode;
}) {
  const [mine, setMine] = useState<Record<number, number>>({});
  const [overrides, setOverrides] = useState<Record<number, DishRating>>({});
  const [comments, setComments] = useState<Record<number, CommentsState>>({});
  const mineRef = useRef(mine);
  mineRef.current = mine;
  const inFlight = useRef(new Set<number>());

  useEffect(() => setMine(readMine()), []);

  const summaryFor = useCallback((dish: Pick<Dish, 'id' | 'rating'>) => overrides[dish.id] ?? dish.rating, [overrides]);
  const mineFor = useCallback((dishId: number) => mine[dishId] ?? 0, [mine]);
  const commentsFor = useCallback((dishId: number) => comments[dishId], [comments]);

  const loadComments = useCallback(
    (dishId: number) => {
      if (!commentsEnabled || inFlight.current.has(dishId)) return;
      inFlight.current.add(dishId);
      setComments((current) => ({ ...current, [dishId]: { status: 'loading', list: current[dishId]?.list ?? [] } }));
      getDishComments(dishId)
        .then((list) => setComments((current) => ({ ...current, [dishId]: list ? { status: 'ok', list } : { status: 'error', list: [] } })))
        .catch(() => setComments((current) => ({ ...current, [dishId]: { status: 'error', list: [] } })))
        .finally(() => inFlight.current.delete(dishId));
    },
    [commentsEnabled],
  );

  const submit = useCallback(
    async (dishId: number, draft: ReviewDraft): Promise<SubmitOutcome> => {
      const hadComment = commentsEnabled && (draft.text.trim() !== '' || draft.reasons.length > 0);
      try {
        const result = await submitDishReview({
          dishId,
          rating: draft.stars,
          reasons: commentsEnabled ? draft.reasons : [],
          text: commentsEnabled ? draft.text : '',
          name: commentsEnabled ? draft.name : '',
          phone: commentsEnabled ? draft.phone : '',
          deviceId: getDeviceId(),
          token: formToken,
          company: draft.company,
        });
        if (result.status !== 'ok') return { ok: false, reason: result.reason };

        setMine((current) => ({ ...current, [dishId]: draft.stars }));
        setOverrides((current) => ({ ...current, [dishId]: result.rating }));
        try {
          window.localStorage.setItem(MINE_KEY, JSON.stringify({ ...mineRef.current, [dishId]: draft.stars }));
        } catch {
          /* storage blocked — the rating is saved on the server regardless */
        }
        const posted = result.comment;
        if (posted) {
          setComments((current) => {
            const existing = current[dishId];
            const list = existing?.list ?? [];
            if (list.some((item) => item.id === posted.id)) return current;
            return { ...current, [dishId]: { status: existing?.status === 'error' ? 'ok' : (existing?.status ?? 'ok'), list: [posted, ...list] } };
          });
        }
        return { ok: true, commentFailed: result.commentFailed, hadComment };
      } catch {
        return { ok: false, reason: 'generic' };
      }
    },
    [commentsEnabled, formToken],
  );

  const value = useMemo(
    () => ({ copy, locale, commentsEnabled, summaryFor, mineFor, commentsFor, loadComments, submit }),
    [copy, locale, commentsEnabled, summaryFor, mineFor, commentsFor, loadComments, submit],
  );
  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>;
}
