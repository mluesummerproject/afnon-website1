import type { Metadata } from 'next';

import { TableFeedbackForm } from '@/components/site/TableFeedbackForm';
import { LanguageMenu } from '@/components/site/LanguageMenu';
import { AnorMark } from '@/components/ui/AnorMark';
import { issueFormToken } from '@/lib/antispam';
import { format } from '@/lib/i18n';
import { getLocaleAndDictionary } from '@/lib/locale';
import { brand } from '@/lib/site';
import { resolveTableByToken } from '@/lib/tables-server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Printed on a QR code at a physical table. Resolved entirely server-side —
 * the token list itself is never exposed to a browser — and carries the full
 * customer-facing visual language, because for many diners this is the very
 * first page of the site they ever open.
 */
export default async function TableFeedbackPage({ params }: { params: { token: string } }) {
  const { locale, dict } = getLocaleAndDictionary();
  const copy = dict.tableFeedback;
  const table = await resolveTableByToken(params.token);

  return (
    <div className="min-h-[100svh] bg-page">
      <header className="border-b border-line bg-page">
        <div className="shell flex h-14 items-center justify-between">
          <span className="flex items-center gap-2">
            <AnorMark className="h-6 w-auto text-accent" />
            <span className="font-wordmark text-[22px] leading-none text-ink">{brand.name}</span>
          </span>
          <LanguageMenu locale={locale} label={dict.a11y.language} switchTo={dict.a11y.switchTo} />
        </div>
      </header>

      <main className="shell max-w-[36rem] py-10 md:py-14">
        {table ? (
          <div className="animate-fade-rise">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/[0.08] text-accent">
                <AnorMark className="h-6 w-auto" />
              </span>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{format(copy.tableLabel, { number: table.tableNumber })}</p>
                <h1 className="text-[24px] font-bold leading-tight text-ink">{copy.heading}</h1>
              </div>
            </div>
            <p className="mt-3 max-w-[30rem] text-[15px] leading-snug text-ink/70">{copy.lead}</p>

            <div className="mt-8">
              <TableFeedbackForm token={params.token} formToken={issueFormToken()} locale={locale} copy={copy} browseHref="/" />
            </div>
          </div>
        ) : (
          <div className="animate-fade-rise text-center">
            <AnorMark className="mx-auto h-10 w-auto text-accent/25" />
            <h1 className="mt-5 text-[22px] font-bold leading-tight text-ink">{copy.invalid.title}</h1>
            <p className="mx-auto mt-2 max-w-[26rem] text-[15px] leading-snug text-ink/60">{copy.invalid.body}</p>
            <a href="/" className="tap mt-6 inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-6 text-button text-white">
              {copy.browseMenu}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
