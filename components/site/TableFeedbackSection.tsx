import { TableFeedbackForm } from '@/components/site/TableFeedbackForm';
import type { Dictionary, Locale } from '@/lib/i18n';

/** The visit-feedback form, kept at the foot of a table's page now that the page is also where guests order. */
export function TableFeedbackSection({
  token,
  formToken,
  locale,
  order,
  copy,
}: {
  token: string;
  formToken: string;
  locale: Locale;
  order: Dictionary['tableOrder'];
  copy: Dictionary['tableFeedback'];
}) {
  return (
    <section id="feedback" aria-labelledby="table-feedback-title" className="scroll-mt-14 border-t border-line bg-page py-10 md:py-14">
      <div className="shell max-w-[36rem]">
        <h2 id="table-feedback-title" className="text-[22px] font-bold leading-tight text-ink">
          {order.feedbackHeading}
        </h2>
        <p className="mt-2 max-w-[30rem] text-[15px] leading-snug text-ink/70">{order.feedbackLead}</p>
        <div className="mt-6">
          <TableFeedbackForm token={token} formToken={formToken} locale={locale} copy={copy} browseHref="#menu" />
        </div>
      </div>
    </section>
  );
}
