import type { Metadata } from 'next';
import Link from 'next/link';

import { deleteComment, setCommentHidden } from '@/app/admin/comments-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { DeleteRecord } from '@/components/admin/DeleteRecord';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { StarIcon } from '@/components/ui/icons';
import { adminCommentsAvailable, COMMENTS_PAGE_SIZE, getAdminComments, getCommentCounts, type AdminComment } from '@/lib/admin-data';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { format, localeMeta } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Comments' };

export default async function CommentsPage({ searchParams }: { searchParams?: { view?: string; page?: string } }) {
  const view = searchParams?.view === 'hidden' ? 'hidden' : 'visible';
  const page = Math.max(1, Math.floor(Number(searchParams?.page) || 1));
  const { locale, dict: t } = getAdminLocaleAndDict();

  const ready = await adminCommentsAvailable();
  if (!ready) {
    return (
      <main className="shell py-6 md:py-10">
        <h1 className="font-display text-display-md text-ink">{t.comments.title}</h1>
        <p className="mt-1 text-body-sm text-ink-secondary">{t.comments.subtitle}</p>
        <AdminEmpty rule title={t.comments.notReadyTitle}>
          {t.comments.notReadyBody}
        </AdminEmpty>
      </main>
    );
  }

  const [counts, { comments, total, error }] = await Promise.all([getCommentCounts(), getAdminComments(view, page)]);
  const pages = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE));

  const timeFormat = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tabs = [
    { key: 'visible', label: t.comments.visible, count: counts.visible, href: '/admin/comments' },
    { key: 'hidden', label: t.comments.hidden, count: counts.hidden, href: '/admin/comments?view=hidden' },
  ] as const;
  const pageHref = (target: number) => `/admin/comments?${[view === 'hidden' ? 'view=hidden' : null, `page=${target}`].filter(Boolean).join('&')}`;

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.comments.title}</h1>
      <p className="mt-1 text-body-sm text-ink-secondary">{t.comments.subtitle}</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t.comments.viewLabel}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={view === tab.key ? 'page' : undefined}
            className={`flex min-h-[2.75rem] items-center gap-2 rounded-hair border px-4 text-body-sm transition-colors duration-quick ${
              view === tab.key ? 'border-anor bg-anor text-paper' : 'border-line-strong bg-surface text-ink hover:border-anor/50'
            }`}
          >
            {tab.label}
            <span className={`figures rounded-pill px-1.5 text-micro font-semibold ${view === tab.key ? 'bg-paper/20' : 'bg-paper-alt text-ink-secondary'}`}>{tab.count}</span>
          </Link>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      {!error && comments.length === 0 ? (
        <AdminEmpty rule title={view === 'hidden' ? t.comments.emptyHiddenTitle : t.comments.emptyVisibleTitle}>
          {view === 'hidden' ? t.comments.emptyHiddenBody : t.comments.emptyVisibleBody}
        </AdminEmpty>
      ) : null}

      <ul className="mt-6 space-y-3">
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} t={t} timeFormat={timeFormat} />
        ))}
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

function CommentCard({ comment, t, timeFormat }: { comment: AdminComment; t: AdminDict; timeFormat: Intl.DateTimeFormat }) {
  const dish = comment.dish_name ?? t.comments.dishGone;
  const author = comment.author_name ?? t.comments.anonymous;

  return (
    <li>
      <article aria-label={`${dish} — ${author}`} className={`rounded-hair border bg-surface p-4 md:p-5 ${comment.is_hidden ? 'border-line border-l-4 border-l-ink-muted' : 'border-line'}`}>
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {comment.is_hidden ? <span className="label rounded-hair bg-paper-alt px-1.5 py-1 text-ink-muted">{t.comments.hiddenBadge}</span> : null}
            <span className="font-display text-[1.3rem] leading-tight text-ink">{dish}</span>
          </h2>
          <time dateTime={comment.created_at} className="figures text-micro text-ink-muted">
            {timeFormat.format(new Date(comment.created_at))}
          </time>
        </header>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-0.5" role="img" aria-label={format(t.comments.stars, { rating: comment.rating })}>
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} size={15} filled={star <= comment.rating} className={star <= comment.rating ? 'text-anor' : 'text-line-strong'} />
            ))}
          </span>
          <span aria-hidden="true" className="text-line-strong">·</span>
          <span className={`text-body-sm ${comment.author_name ? 'font-medium text-ink' : 'text-ink-muted'}`}>{author}</span>
        </div>

        {comment.reasons.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {comment.reasons.map((key) => (
              <li key={key} className="label rounded-hair bg-anor-tint px-2 py-1 text-anor">
                {t.comments.reasons[key]}
              </li>
            ))}
          </ul>
        ) : null}

        {comment.comment ? (
          <p className="mt-3 whitespace-pre-wrap break-words text-body text-ink">{comment.comment}</p>
        ) : (
          <p className="mt-3 text-body-sm italic text-ink-muted">{t.comments.reasonsOnly}</p>
        )}

        {comment.author_phone ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-body-sm text-ink-secondary">
            <span className="label text-ink-muted">{t.comments.phone}</span>
            <a href={`tel:${comment.author_phone.replace(/[^\d+]/g, '')}`} className="figures font-medium text-ink underline underline-offset-4">
              {comment.author_phone}
            </a>
            <span className="text-micro text-ink-muted">· {t.comments.phoneNote}</span>
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
          <ActionForm action={setCommentHidden}>
            <input type="hidden" name="id" value={comment.id} />
            <input type="hidden" name="hidden" value={comment.is_hidden ? 'false' : 'true'} />
            <SubmitButton variant={comment.is_hidden ? 'secondary' : 'ghost'} pendingLabel={t.comments.working} className="w-full sm:w-auto">
              {comment.is_hidden ? t.comments.restore : t.comments.hide}
            </SubmitButton>
          </ActionForm>
          {comment.is_hidden ? (
            <div className="sm:ml-auto">
              <DeleteRecord action={deleteComment.bind(null, comment.id)} confirmText={t.comments.deleteConfirm} />
            </div>
          ) : null}
        </div>
      </article>
    </li>
  );
}
