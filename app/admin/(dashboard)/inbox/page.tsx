import type { Metadata } from 'next';
import Link from 'next/link';

import { setMessageRead } from '@/app/admin/inbox-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { getMessages, getUnreadCount, MESSAGES_PAGE_SIZE } from '@/lib/admin-data';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { replyLink } from '@/lib/contact';
import { format, localeMeta } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Inbox' };


export default async function InboxPage({ searchParams }: { searchParams?: { filter?: string; page?: string } }) {
  const filter = searchParams?.filter === 'unread' ? 'unread' : 'all';
  const page = Math.max(1, Math.floor(Number(searchParams?.page) || 1));
  const [{ messages, total, error }, unread] = await Promise.all([getMessages(filter, page), getUnreadCount()]);
  const pages = Math.max(1, Math.ceil(total / MESSAGES_PAGE_SIZE));
  const { locale, dict: t } = getAdminLocaleAndDict();

  // Dates read in the language of the panel, always in the restaurant's own time.
  const timeFormat = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const replyLabels = { phone: t.inbox.call, telegram: t.inbox.openTelegram, email: t.inbox.email } as const;

  const tabs = [
    { key: 'all', label: t.inbox.all, href: '/admin/inbox' },
    { key: 'unread', label: format(t.inbox.unread, { count: unread }), href: '/admin/inbox?filter=unread' },
  ];

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.inbox.title}</h1>
      <p className="mt-1 text-body-sm text-ink-secondary">{t.inbox.subtitle}</p>

      <div className="mt-6 flex gap-2" role="group" aria-label={t.inbox.show}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={filter === tab.key ? 'page' : undefined}
            className={`flex min-h-[2.75rem] items-center rounded-hair border px-4 text-body-sm ${
              filter === tab.key ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink hover:border-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      {!error && messages.length === 0 ? (
        <div className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-display-sm text-ink">{filter === 'unread' ? t.inbox.caughtUpTitle : t.inbox.emptyTitle}</h2>
          <p className="mt-2 text-body-sm text-ink-secondary">{filter === 'unread' ? t.inbox.caughtUpBody : t.inbox.emptyBody}</p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-3">
        {messages.map((message) => {
          const isUnread = message.is_read !== true;
          const reply = replyLink(message.contact);
          return (
            <li key={message.id}>
              <article
                aria-label={format(isUnread ? t.inbox.unreadFrom : t.inbox.messageFrom, { name: message.name })}
                className={`rounded-hair border bg-surface p-4 md:p-5 ${isUnread ? 'border-anor-ink/40 border-l-4 border-l-anor-ink' : 'border-line'}`}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="flex items-baseline gap-2.5">
                    {isUnread ? <span className="label rounded-hair bg-anor px-1.5 py-1 text-on-anor">{t.inbox.new}</span> : null}
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
                      className="inline-flex min-h-[2.75rem] items-center justify-center rounded-hair bg-anor px-5 text-label-lg font-medium uppercase text-on-anor hover:bg-anor-hover"
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
        })}
      </ul>

      {pages > 1 ? (
        <nav aria-label={t.inbox.pages} className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={`/admin/inbox?${filter === 'unread' ? 'filter=unread&' : ''}page=${page - 1}`} className="min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
              {t.inbox.newer}
            </Link>
          ) : (
            <span />
          )}
          <span className="figures text-micro text-ink-muted">{format(t.inbox.pageOf, { page, pages })}</span>
          {page < pages ? (
            <Link href={`/admin/inbox?${filter === 'unread' ? 'filter=unread&' : ''}page=${page + 1}`} className="min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
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
