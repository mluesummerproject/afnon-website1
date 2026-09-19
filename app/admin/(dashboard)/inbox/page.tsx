import type { Metadata } from 'next';
import Link from 'next/link';

import { setFeedbackRead, setMessageRead } from '@/app/admin/inbox-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { StarIcon } from '@/components/ui/icons';
import { getFeedback, getMessages, getUnifiedInbox, getUnreadCount, getUnreadFeedbackCount, MESSAGES_PAGE_SIZE, type InboxEntry } from '@/lib/admin-data';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { replyLink } from '@/lib/contact';
import { format, localeMeta } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Inbox' };

type Source = 'all' | 'messages' | 'feedback';

export default async function InboxPage({ searchParams }: { searchParams?: { source?: string; filter?: string; page?: string } }) {
  const source: Source = searchParams?.source === 'messages' ? 'messages' : searchParams?.source === 'feedback' ? 'feedback' : 'all';
  const filter = searchParams?.filter === 'unread' ? 'unread' : 'all';
  const page = Math.max(1, Math.floor(Number(searchParams?.page) || 1));

  const [unreadMessages, unreadFeedback] = await Promise.all([getUnreadCount(), getUnreadFeedbackCount()]);

  let entries: InboxEntry[] = [];
  let total = 0;
  let error: string | undefined;

  if (source === 'messages') {
    const result = await getMessages(filter, page);
    entries = result.messages.map((message) => ({ kind: 'message', ...message }));
    total = result.total;
    error = result.error;
  } else if (source === 'feedback') {
    const result = await getFeedback(filter, page);
    entries = result.feedback.map((feedback) => ({ kind: 'feedback', ...feedback }));
    total = result.total;
    error = result.error;
  } else {
    const result = await getUnifiedInbox(page);
    entries = result.entries;
    total = result.total;
    error = result.error;
  }

  const pages = Math.max(1, Math.ceil(total / MESSAGES_PAGE_SIZE));
  const { locale, dict: t } = getAdminLocaleAndDict();

  const timeFormat = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const replyLabels = { phone: t.inbox.call, telegram: t.inbox.openTelegram, email: t.inbox.email } as const;

  const sourceTabs: { key: Source; label: string; badge: number; href: string }[] = [
    { key: 'all', label: t.inbox.sourceAll, badge: unreadMessages + unreadFeedback, href: '/admin/inbox' },
    { key: 'messages', label: t.inbox.sourceMessages, badge: unreadMessages, href: '/admin/inbox?source=messages' },
    { key: 'feedback', label: t.inbox.sourceFeedback, badge: unreadFeedback, href: '/admin/inbox?source=feedback' },
  ];

  const pageHref = (target: number) => {
    const parts = [source !== 'all' ? `source=${source}` : null, filter === 'unread' ? 'filter=unread' : null, `page=${target}`].filter(Boolean);
    return `/admin/inbox?${parts.join('&')}`;
  };

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.inbox.title}</h1>
      <p className="mt-1 text-body-sm text-ink-secondary">{t.inbox.subtitle}</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t.inbox.sourceLabel}>
        {sourceTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={source === tab.key ? 'page' : undefined}
            className={`flex min-h-[2.75rem] items-center gap-2 rounded-hair border px-4 text-body-sm transition-colors duration-quick ${
              source === tab.key ? 'border-anor bg-anor text-paper' : 'border-line-strong bg-surface text-ink hover:border-anor/50'
            }`}
          >
            {tab.label}
            {tab.badge > 0 ? (
              <span className={`figures rounded-pill px-1.5 text-micro font-semibold ${source === tab.key ? 'bg-paper/20' : 'bg-anor-tint text-anor'}`}>{tab.badge}</span>
            ) : null}
          </Link>
        ))}
      </div>

      {source !== 'all' ? (
        <div className="mt-3 flex gap-2" role="group" aria-label={t.inbox.show}>
          {(
            [
              { key: 'all', label: t.inbox.all, href: `/admin/inbox?source=${source}` },
              { key: 'unread', label: format(t.inbox.unread, { count: source === 'messages' ? unreadMessages : unreadFeedback }), href: `/admin/inbox?source=${source}&filter=unread` },
            ] as const
          ).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={filter === tab.key ? 'page' : undefined}
              className={`flex min-h-[2.75rem] items-center rounded-hair border px-3.5 text-micro font-semibold uppercase ${
                filter === tab.key ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink-secondary hover:border-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      {!error && entries.length === 0 ? (
        <div className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-display-sm text-ink">{filter === 'unread' ? t.inbox.caughtUpTitle : t.inbox.emptyTitle}</h2>
          <p className="mt-2 text-body-sm text-ink-secondary">{filter === 'unread' ? t.inbox.caughtUpBody : t.inbox.emptyBody}</p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-3">
        {entries.map((entry) =>
          entry.kind === 'message' ? (
            <MessageCard key={`m-${entry.id}`} message={entry} t={t} timeFormat={timeFormat} replyLabels={replyLabels} />
          ) : (
            <FeedbackCard key={`f-${entry.id}`} feedback={entry} t={t} timeFormat={timeFormat} />
          ),
        )}
      </ul>

      {pages > 1 ? (
        <nav aria-label={t.inbox.pages} className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
              {t.inbox.newer}
            </Link>
          ) : (
            <span />
          )}
          <span className="figures text-micro text-ink-muted">{format(t.inbox.pageOf, { page, pages })}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
              {t.inbox.older}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}

type AdminDict = ReturnType<typeof getAdminLocaleAndDict>['dict'];

function MessageCard({
  message,
  t,
  timeFormat,
  replyLabels,
}: {
  message: Extract<InboxEntry, { kind: 'message' }>;
  t: AdminDict;
  timeFormat: Intl.DateTimeFormat;
  replyLabels: { phone: string; telegram: string; email: string };
}) {
  const isUnread = message.is_read !== true;
  const reply = replyLink(message.contact);
  return (
    <li>
      <article
        aria-label={format(isUnread ? t.inbox.unreadFrom : t.inbox.messageFrom, { name: message.name })}
        className={`rounded-hair border bg-surface p-4 md:p-5 ${isUnread ? 'border-anor/40 border-l-4 border-l-anor' : 'border-line'}`}
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="flex items-baseline gap-2.5">
            {isUnread ? <span className="label rounded-hair bg-anor px-1.5 py-1 text-paper">{t.inbox.new}</span> : null}
            <span className={`font-display text-[1.3rem] leading-tight ${isUnread ? 'text-ink' : 'text-ink-secondary'}`}>{message.name}</span>
          </h2>
          <time dateTime={message.created_at} className="figures text-micro text-ink-muted">
            {timeFormat.format(new Date(message.created_at))}
          </time>
        </header>

        <p className="mt-1 break-words text-body-sm text-ink-secondary">{message.contact || t.inbox.noContact}</p>
        <p className={`mt-3 whitespace-pre-wrap break-words text-body ${isUnread ? 'text-ink' : 'text-ink-secondary'}`}>{message.message}</p>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
          {reply ? (
            <a
              href={reply.href}
              {...(reply.kind === 'telegram' ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-hair bg-anor px-5 text-label-lg font-medium uppercase text-paper hover:bg-anor-hover"
            >
              {replyLabels[reply.kind]}
            </a>
          ) : null}
          <ActionForm action={setMessageRead}>
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="read" value={isUnread ? 'true' : 'false'} />
            <SubmitButton variant={isUnread ? 'secondary' : 'ghost'} pendingLabel={t.inbox.saving} className="w-full sm:w-auto">
              {isUnread ? t.inbox.markRead : t.inbox.markUnread}
            </SubmitButton>
          </ActionForm>
        </div>
      </article>
    </li>
  );
}

function FeedbackCard({
  feedback,
  t,
  timeFormat,
}: {
  feedback: Extract<InboxEntry, { kind: 'feedback' }>;
  t: AdminDict;
  timeFormat: Intl.DateTimeFormat;
}) {
  const isUnread = feedback.status !== 'read';
  const tableLabel = feedback.table_number ? format(t.inbox.feedbackFrom, { table: feedback.table_number }) : t.inbox.feedbackGeneral;

  return (
    <li>
      <article
        aria-label={tableLabel}
        className={`rounded-hair border bg-surface p-4 md:p-5 ${isUnread ? 'border-anor/40 border-l-4 border-l-anor' : 'border-line'}`}
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="flex items-baseline gap-2.5">
            {isUnread ? <span className="label rounded-hair bg-anor px-1.5 py-1 text-paper">{t.inbox.new}</span> : null}
            <span className={`font-display text-[1.3rem] leading-tight ${isUnread ? 'text-ink' : 'text-ink-secondary'}`}>{tableLabel}</span>
          </h2>
          <time dateTime={feedback.created_at} className="figures text-micro text-ink-muted">
            {timeFormat.format(new Date(feedback.created_at))}
          </time>
        </header>

        <div className="mt-1.5 flex items-center gap-2">
          {feedback.overall_rating ? (
            <span className="flex items-center gap-0.5" aria-label={format(t.inbox.ratingOutOf, { rating: feedback.overall_rating })}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} size={15} filled={star <= feedback.overall_rating!} className={star <= feedback.overall_rating! ? 'text-anor' : 'text-line-strong'} />
              ))}
            </span>
          ) : (
            <span className="text-micro text-ink-muted">{t.inbox.noRating}</span>
          )}
          <span aria-hidden="true" className="text-line-strong">·</span>
          <span className={`label rounded-hair px-1.5 py-0.5 ${feedback.is_anonymous ? 'bg-paper-alt text-ink-muted' : 'bg-anor-tint text-anor'}`}>
            {feedback.is_anonymous ? t.inbox.feedbackAnonymous : feedback.name || t.inbox.feedbackAnonymous}
          </span>
        </div>

        <p className={`mt-3 whitespace-pre-wrap break-words text-body ${isUnread ? 'text-ink' : 'text-ink-secondary'} ${feedback.comment ? '' : 'italic text-ink-muted'}`}>
          {feedback.comment || t.inbox.noComment}
        </p>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
          {!feedback.is_anonymous && feedback.phone ? (
            <a href={`tel:${feedback.phone}`} className="inline-flex min-h-[2.75rem] items-center justify-center rounded-hair bg-anor px-5 text-label-lg font-medium uppercase text-paper hover:bg-anor-hover">
              {t.inbox.call}
            </a>
          ) : null}
          <ActionForm action={setFeedbackRead}>
            <input type="hidden" name="id" value={feedback.id} />
            <input type="hidden" name="read" value={isUnread ? 'true' : 'false'} />
            <SubmitButton variant={isUnread ? 'secondary' : 'ghost'} pendingLabel={t.inbox.saving} className="w-full sm:w-auto">
              {isUnread ? t.inbox.markRead : t.inbox.markUnread}
            </SubmitButton>
          </ActionForm>
        </div>
      </article>
    </li>
  );
}
