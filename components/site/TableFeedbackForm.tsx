'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { sendFeedback, type FeedbackState } from '@/app/actions/feedback';
import { StarRating } from '@/components/ui/StarRating';
import { format, type Dictionary, type Locale } from '@/lib/i18n';
import { ease } from '@/lib/motion';

type Copy = Dictionary['tableFeedback'];

const initialState: FeedbackState = { status: 'idle' };

export function TableFeedbackForm({
  token,
  formToken,
  locale,
  copy,
  browseHref,
}: {
  token: string;
  formToken: string;
  locale: Locale;
  copy: Copy;
  browseHref: string;
}) {
  const [state, action] = useFormState(sendFeedback, initialState);
  const [rating, setRating] = useState(0);
  const [anonymous, setAnonymous] = useState(true);
  const successRef = useRef<HTMLHeadingElement>(null);

  if (state.status === 'success') {
    return (
      <motion.div role="status" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease }}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{copy.successLabel}</p>
        <h2 ref={successRef} tabIndex={-1} className="mt-1.5 text-[24px] font-bold leading-tight text-ink outline-none">
          {copy.successTitle}
        </h2>
        <p className="mt-2 text-[15px] leading-snug text-ink/70">{copy.successBody}</p>
        <a
          href={browseHref}
          className="tap mt-6 inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-6 text-button text-white"
        >
          {copy.browseMenu}
        </a>
      </motion.div>
    );
  }

  const errorText = state.status === 'error' ? copy.errors[state.reason] : null;

  return (
    <form action={action} noValidate className="relative space-y-6">
      <input type="hidden" name="token" value={formToken} />
      <input type="hidden" name="tableToken" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="anonymous" value={anonymous ? 'true' : 'false'} />

      {/* Honeypot — invisible to people and to assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <AnimatePresence>
        {errorText ? (
          <motion.p
            role="alert"
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 rounded-[12px] border-l-2 border-accent bg-accent/[0.06] px-4 py-3 text-[14px] leading-snug text-ink"
          >
            <span aria-hidden="true" className="font-bold text-accent">!</span>
            {errorText}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div>
        <p className="text-[14px] font-semibold text-ink/80">
          {copy.ratingLabel} <span className="font-normal text-ink/50">· {copy.ratingHint}</span>
        </p>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size={40} labelFor={(star) => format(copy.star, { count: star })} />
        </div>
        <input type="hidden" name="rating" value={rating || ''} />
      </div>

      <div>
        <label htmlFor="feedback-comment" className="text-[14px] font-semibold text-ink/80">
          {copy.comment}
        </label>
        <textarea
          id="feedback-comment"
          name="comment"
          rows={4}
          maxLength={2000}
          placeholder={copy.commentPlaceholder}
          className="field mt-2 border-line-strong placeholder:text-ink/40"
        />
        {rating === 0 ? <p className="mt-1.5 text-[12px] text-ink/50">{copy.commentRequiredHint}</p> : null}
      </div>

      <div className="rounded-[14px] bg-fill px-4 py-3.5">
        <label className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-semibold text-ink">{copy.anonymousLabel}</span>
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            onClick={() => setAnonymous((value) => !value)}
            className={`tap relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${anonymous ? 'bg-accent' : 'bg-ink/20'}`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${anonymous ? 'translate-x-1' : 'translate-x-6'}`}
            />
          </button>
        </label>
        <p className="mt-1.5 text-[12px] leading-snug text-ink/60">{anonymous ? copy.anonymousHint : copy.identifyHint}</p>

        <AnimatePresence initial={false}>
          {!anonymous ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 pt-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="feedback-name" className="text-[13px] font-medium text-ink/70">
                    {copy.name} <span className="text-ink/45">· {copy.optional}</span>
                  </label>
                  <input id="feedback-name" name="name" type="text" maxLength={120} className="field mt-1.5 border-line-strong" />
                </div>
                <div>
                  <label htmlFor="feedback-phone" className="text-[13px] font-medium text-ink/70">
                    {copy.phone} <span className="text-ink/45">· {copy.optional}</span>
                  </label>
                  <input id="feedback-phone" name="phone" type="tel" inputMode="tel" maxLength={32} className="field mt-1.5 border-line-strong" />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-snug text-ink/50">
          {copy.privacy}{' '}
          <a href="/maxfiylik" className="inline-flex min-h-[44px] items-center font-medium text-ink/70 underline underline-offset-4">
            {copy.privacyLink}
          </a>
        </p>
        <Submit label={copy.submit} pendingLabel={copy.sending} />
      </div>
    </form>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="tap flex h-12 w-full shrink-0 items-center justify-center rounded-[14px] bg-accent text-button text-white disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-8"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
