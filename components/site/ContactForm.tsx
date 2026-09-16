'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { sendMessage, type ContactState } from '@/app/actions/contact';
import { CONTACT_LIMITS, type ContactField } from '@/lib/contact';
import { format, type Dictionary } from '@/lib/i18n';
import { ease } from '@/lib/motion';

type Copy = Dictionary['contact'];

type ContactFormProps = {
  token: string;
  copy: Copy;
  /** null when no phone number has been configured — the success view then omits the call button. */
  callHref: string | null;
  callLabel: string;
};

/**
 * Short and human: name, a way to reply, a message. Remounting on "write
 * another" gives a genuinely fresh form, so a sent message can't be re-sent
 * by accident.
 */
export function ContactForm(props: ContactFormProps) {
  const [instance, setInstance] = useState(0);
  return <ContactFormInstance key={instance} {...props} onReset={() => setInstance((value) => value + 1)} />;
}

const initialState: ContactState = { status: 'idle' };

function ContactFormInstance({ token, copy, callHref, callLabel, onReset }: ContactFormProps & { onReset: () => void }) {
  const [state, action] = useFormState(sendMessage, initialState);
  const successRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === 'success') successRef.current?.focus();
    if (state.status === 'error') summaryRef.current?.focus();
  }, [state]);

  if (state.status === 'success') {
    // Position-only entrance: opacity always stays 1, so this text is readable
    // even if the animation never runs (e.g. a hydration hiccup).
    return (
      <motion.div role="status" initial={{ y: 12 }} animate={{ y: 0 }} transition={{ duration: 0.7, ease }}>
        <p className="label flex items-center gap-3 text-anor">
          <motion.span
            aria-hidden="true"
            className="block h-px w-8 origin-left bg-anor"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease }}
          />
          {copy.successLabel}
        </p>
        <h4 ref={successRef} tabIndex={-1} className="mt-5 font-display text-display-md text-ink outline-none">
          {format(copy.successTitle, { name: state.name })}
        </h4>
        <p className="mt-4 max-w-measure text-body text-ink-secondary">{format(copy.successBody, { contact: state.contact })}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {callHref ? (
            <a
              href={callHref}
              className="inline-flex min-h-[3.25rem] items-center justify-center rounded-hair bg-anor px-6 text-label-lg font-medium uppercase text-paper transition-colors duration-base ease-brand hover:bg-anor-hover"
            >
              {callLabel}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-hair border border-line-strong px-6 text-label-lg font-medium uppercase text-ink transition-colors duration-base ease-brand hover:border-ink"
          >
            {copy.sendAnother}
          </button>
        </div>
      </motion.div>
    );
  }

  const invalid: ContactField[] = state.status === 'error' ? state.invalid : [];
  const values = state.status === 'error' ? state.values : undefined;
  const summary =
    state.status === 'error'
      ? state.reason === 'fields'
        ? copy.errors.summary
        : state.reason === 'rateLimited'
          ? copy.errors.rateLimited
          : copy.errors.generic
      : null;

  return (
    <form action={action} noValidate className="relative grid gap-6">
      <input type="hidden" name="token" value={token} />

      {/* Honeypot — invisible to people and to assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <AnimatePresence>
        {summary ? (
          <motion.p
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            initial={{ y: -6 }}
            animate={{ y: 0 }}
            className="flex gap-3 border-l-2 border-anor bg-anor-tint px-4 py-3 text-body-sm text-ink outline-none"
          >
            <span aria-hidden="true" className="font-medium text-anor">!</span>
            {summary}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Field
        name="name"
        label={copy.name}
        error={copy.errors.name}
        invalid={invalid.includes('name')}
        defaultValue={values?.name}
        maxLength={CONTACT_LIMITS.name.max}
        autoComplete="name"
      />
      <Field
        name="contact"
        label={copy.contact}
        hint={copy.contactHint}
        error={copy.errors.contact}
        invalid={invalid.includes('contact')}
        defaultValue={values?.contact}
        maxLength={CONTACT_LIMITS.contact.max}
        autoComplete="tel"
        inputMode="text"
      />
      <Field
        name="message"
        label={copy.message}
        error={copy.errors.message}
        invalid={invalid.includes('message')}
        defaultValue={values?.message}
        maxLength={CONTACT_LIMITS.message.max}
        multiline
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-micro text-ink-muted">{copy.privacy}</p>
        <Submit label={copy.submit} pendingLabel={copy.sending} />
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  invalid,
  defaultValue,
  maxLength,
  multiline = false,
  autoComplete,
  inputMode,
}: {
  name: ContactField;
  label: string;
  hint?: string;
  error: string;
  invalid: boolean;
  defaultValue?: string;
  maxLength: number;
  multiline?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'tel';
}) {
  const id = `contact-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const classes = `field mt-2.5 border-transparent ${invalid ? 'ring-2 ring-anor' : ''}`;

  return (
    <div>
      <label htmlFor={id} className="label block text-ink-secondary">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={4}
          required
          maxLength={maxLength}
          defaultValue={defaultValue}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={classes}
        />
      ) : (
        <input
          id={id}
          name={name}
          type="text"
          required
          maxLength={maxLength}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={classes}
        />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-micro text-ink-muted">
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p id={`${id}-error`} className="mt-2 flex gap-2 text-micro text-anor">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group inline-flex min-h-[3.25rem] w-full shrink-0 items-center justify-center gap-3 rounded-hair bg-anor px-8 text-label-lg font-medium uppercase text-paper transition-colors duration-base ease-brand hover:bg-anor-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? pendingLabel : label}
      {!pending ? (
        <span aria-hidden="true" className="block h-px w-4 bg-current transition-[width] duration-base ease-brand group-hover:w-7" />
      ) : null}
    </button>
  );
}
