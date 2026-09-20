'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useRatings, type ReviewDraft } from '@/components/site/menu/RatingsContext';
import { StarRating } from '@/components/ui/StarRating';
import { StarIcon } from '@/components/ui/icons';
import { format, localeMeta, plural, type Locale } from '@/lib/i18n';
import { ease } from '@/lib/motion';
import { COMMENT_LIMITS, formatAverage, reasonsFor, type PublicComment, type ReasonKey } from '@/lib/ratings';
import type { Dish } from '@/lib/types';

type Status = 'idle' | 'sending' | 'thanks' | 'error';

/**
 * Everything a guest can say about one dish, inside its sheet: the average so
 * far, the stars to tap, and — once a star is chosen — one-tap reasons, free
 * text and an optional name and/or phone; then what other guests have written.
 *
 * A star rating is always required: it is what enables Send, and words on
 * their own cannot be sent. Reasons are separate from the text and only the
 * ones that fit the stars are offered (what went wrong for 1–2, what went right
 * for 4–5). The section is one fixed block whether or not the dish has been
 * rated, so opening a dish never shifts the sheet.
 */
export function DishReviews({ dish }: { dish: Dish }) {
  const { summaryFor, mineFor, submit, commentsEnabled, commentsFor, loadComments, copy, locale } = useRatings();
  const summary = summaryFor(dish);
  const saved = mineFor(dish.id);

  const [stars, setStars] = useState(saved);
  const [reasons, setReasons] = useState<ReasonKey[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const trap = useRef<HTMLInputElement>(null);
  const timer = useRef<number>();

  // The device's saved stars arrive from localStorage just after mount; take them once, if the guest has not chosen yet.
  useEffect(() => {
    setStars((current) => current || saved);
  }, [saved]);

  useEffect(() => {
    if (commentsEnabled) loadComments(dish.id);
  }, [commentsEnabled, loadComments, dish.id]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const offered = reasonsFor(stars);
  const hasWords = text.trim() !== '' || reasons.length > 0;
  // Send needs stars, and something new: different stars than the saved ones, or words.
  const canSend = stars > 0 && (stars !== saved || (commentsEnabled && hasWords)) && status !== 'sending';

  const chooseStars = (value: number) => {
    setStars(value);
    // Keep only the reasons that still fit the new stars (1–2 low, 4–5 high, 3 none).
    const allowed = reasonsFor(value);
    setReasons((current) => current.filter((key) => allowed.includes(key)));
    if (status === 'thanks' || status === 'error') setStatus('idle');
  };

  const toggleReason = (key: ReasonKey) => {
    setReasons((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
    if (status === 'thanks' || status === 'error') setStatus('idle');
  };

  const send = async () => {
    if (!canSend) return;
    window.clearTimeout(timer.current);
    setStatus('sending');
    const draft: ReviewDraft = { stars, reasons, text, name, phone, company: trap.current?.value ?? '' };
    const outcome = await submit(dish.id, draft);
    if (!outcome.ok) {
      setMessage(copy.errors[outcome.reason === 'invalid' ? 'generic' : outcome.reason]);
      setStatus('error');
      return;
    }
    if (outcome.commentFailed) {
      setMessage(copy.errors.commentFailed);
      setStatus('error');
      return;
    }
    setMessage(outcome.hadComment ? copy.sent : copy.sentRating);
    setStatus('thanks');
    setReasons([]);
    setText('');
    timer.current = window.setTimeout(() => setStatus('idle'), 4000);
  };

  const comments = commentsEnabled ? commentsFor(dish.id) : undefined;

  return (
    <section aria-label={copy.heading} className="mt-5">
      <div className="relative rounded-[14px] bg-fill px-4 py-3.5">
        <div className="flex min-h-[20px] items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-ink">{copy.heading}</h3>
          {summary ? (
            <p
              className="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-ink"
              aria-label={`${format(copy.summaryAria, { average: formatAverage(summary.average) })}, ${plural(copy.count, summary.count, locale)}`}
            >
              <StarIcon size={14} filled className="text-accent" />
              {formatAverage(summary.average)}
              <span className="font-medium text-ink/55">· {plural(copy.count, summary.count, locale)}</span>
            </p>
          ) : (
            <p className="text-[13px] text-ink/55">{copy.unrated}</p>
          )}
        </div>

        <div className="-ml-1 mt-1.5">
          <StarRating value={stars} onChange={chooseStars} size={44} seed labelFor={(star) => format(copy.star, { count: star })} />
        </div>

        <AnimatePresence initial={false}>
          {commentsEnabled && stars > 0 ? (
            <motion.div
              key="words"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease }}
              className="overflow-hidden"
            >
              <div className="space-y-3.5 pt-2">
                {offered.length > 0 ? (
                  <div>
                    <p className="text-[13px] font-medium text-ink/70">{copy.reasonsLabel}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {offered.map((key) => {
                        const on = reasons.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleReason(key)}
                            className={`tap min-h-[36px] rounded-full border px-3.5 text-[13px] font-medium leading-tight transition-colors duration-150 ${
                              on ? 'border-accent bg-accent text-white' : 'border-line-strong bg-card text-ink/80 hover:border-accent/60'
                            }`}
                          >
                            {copy.reasons[key]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label htmlFor={`review-text-${dish.id}`} className="text-[13px] font-medium text-ink/70">
                    {copy.commentLabel}
                  </label>
                  <textarea
                    id={`review-text-${dish.id}`}
                    rows={3}
                    maxLength={COMMENT_LIMITS.text}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={copy.commentPlaceholder}
                    className="field mt-1.5 border-line-strong placeholder:text-ink/40"
                  />
                </div>

                <div>
                  <div className="grid gap-2.5 min-[430px]:grid-cols-2">
                    <div>
                      <label htmlFor={`review-name-${dish.id}`} className="text-[13px] font-medium text-ink/70">
                        {copy.nameLabel}
                      </label>
                      <input
                        id={`review-name-${dish.id}`}
                        type="text"
                        autoComplete="off"
                        maxLength={COMMENT_LIMITS.name}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="field mt-1.5 border-line-strong"
                      />
                    </div>
                    <div>
                      <label htmlFor={`review-phone-${dish.id}`} className="text-[13px] font-medium text-ink/70">
                        {copy.phoneLabel}
                      </label>
                      <input
                        id={`review-phone-${dish.id}`}
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        maxLength={32}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="field mt-1.5 border-line-strong"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-snug text-ink/55">{copy.contactHint}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Honeypot — invisible to people and to assistive technology. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
          <label>
            Company
            <input ref={trap} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          aria-busy={status === 'sending'}
          className="tap mt-3 flex h-12 w-full items-center justify-center rounded-[14px] bg-accent text-button text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'sending' ? copy.sending : copy.send}
        </button>

        <div className="min-h-[20px] pt-2" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {status === 'thanks' ? (
              <motion.p key="thanks" initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease }} className="text-[13px] font-medium text-accent">
                {message}
              </motion.p>
            ) : status === 'error' ? (
              <motion.p key="error" role="alert" initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease }} className="text-[13px] leading-snug text-accent">
                {message}
              </motion.p>
            ) : stars === 0 ? (
              <motion.p key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px] text-ink/55">
                {copy.chooseStars}
              </motion.p>
            ) : saved > 0 && stars === saved && !hasWords ? (
              <motion.p key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px] text-ink/55">
                {copy.yours}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {commentsEnabled ? (
        <div className="mt-5">
          <h3 className="text-[14px] font-semibold text-ink">{copy.commentsHeading}</h3>
          {!comments || comments.status === 'loading' ? (
            comments && comments.list.length > 0 ? null : <p className="mt-2 text-[13px] text-ink/55">{copy.commentsLoading}</p>
          ) : comments.status === 'error' ? (
            <p className="mt-2 text-[13px] text-ink/55">{copy.commentsError}</p>
          ) : comments.list.length === 0 ? (
            <p className="mt-2 text-[13px] leading-snug text-ink/55">{copy.noComments}</p>
          ) : null}
          <ul className="mt-2 space-y-2.5">
            <AnimatePresence initial={false}>
              {(comments?.list ?? []).map((comment) => (
                <CommentItem key={comment.id} comment={comment} locale={locale} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CommentItem({ comment, locale }: { comment: PublicComment; locale: Locale }) {
  const { copy } = useRatings();
  const date = useMemo(() => {
    const parsed = new Date(comment.created_at);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
  }, [comment.created_at, locale]);

  return (
    <motion.li
      layout="position"
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease }}
      className="rounded-[12px] border border-line bg-card px-3.5 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-semibold text-ink">{comment.author_name ?? copy.anonymous}</p>
        <span className="flex shrink-0 items-center gap-px" role="img" aria-label={format(copy.summaryAria, { average: comment.rating })}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} size={13} filled={star <= comment.rating} className={star <= comment.rating ? 'text-accent' : 'text-ink/20'} />
          ))}
        </span>
      </div>
      {comment.reasons.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {comment.reasons.map((key) => (
            <li key={key} className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium leading-none text-ink/75">
              {copy.reasons[key]}
            </li>
          ))}
        </ul>
      ) : null}
      {comment.comment ? <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-[1.45] text-ink/80">{comment.comment}</p> : null}
      {date ? <p className="mt-1.5 text-[12px] text-ink/45">{date}</p> : null}
    </motion.li>
  );
}
