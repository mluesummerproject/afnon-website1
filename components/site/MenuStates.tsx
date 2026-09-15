import { Action } from '@/components/ui/Action';
import { contact } from '@/lib/site';

function Notice({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-line-strong py-16 md:py-20">
      <p className="label text-ink-muted">{label}</p>
      <p className="mt-5 max-w-measure-wide font-display text-display-md text-ink">{title}</p>
      {children}
    </div>
  );
}

/** Streamed while the live menu is read. Mirrors the real rows, so nothing jumps. */
export function MenuSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-px w-full bg-line-strong" />
      <div className="mt-6 h-7 w-44 bg-line/70" />
      <ul className="mt-8">
        {[0, 1, 2, 3, 4].map((row) => (
          <li key={row} className="border-t border-line py-7">
            <div className="flex items-start justify-between gap-8">
              <div className="w-full max-w-measure">
                <div className="h-5 w-1/2 bg-line/70" />
                <div className="mt-4 h-3 w-full bg-line/50" />
                <div className="mt-2 h-3 w-4/5 bg-line/50" />
              </div>
              <div className="h-4 w-16 shrink-0 bg-line/70" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading the menu…</span>
    </div>
  );
}

export function MenuEmpty() {
  return (
    <Notice label="Today" title="The kitchen is still writing today’s list.">
      <p className="mt-5 max-w-measure text-body text-ink-secondary">
        Nothing is published to the menu at the moment. Call the restaurant and we will tell you
        what is on the fire.
      </p>
      <Action href={contact.phone.href} variant="quiet" withArrow className="mt-6">
        {contact.phone.display}
      </Action>
    </Notice>
  );
}

export function MenuError({ message }: { message: string }) {
  return (
    <Notice label="Menu" title={message}>
      <p className="mt-5 max-w-measure text-body text-ink-secondary">
        Please refresh in a moment, or reach us directly — we are happy to read it to you.
      </p>
      <Action href={contact.telegram.href} variant="quiet" withArrow className="mt-6">
        Message us on Telegram
      </Action>
    </Notice>
  );
}
