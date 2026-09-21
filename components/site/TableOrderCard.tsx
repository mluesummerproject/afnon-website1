import { AnorMark } from '@/components/ui/AnorMark';
import { format, type Dictionary } from '@/lib/i18n';

/**
 * Replaces the homepage hero on a table's own page: it says which table the
 * order goes to, so the guest never has to be asked. Static markup — the table
 * number is display only; the server looks the table up again from the QR
 * token when the order is placed.
 */
export function TableOrderCard({ number, copy }: { number: string; copy: Dictionary['tableOrder'] }) {
  return (
    <section aria-labelledby="table-order-title" className="shell pt-4">
      <div className="animate-fade-rise flex items-center gap-3.5 rounded-[16px] border border-accent/20 bg-accent/[0.04] p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/[0.08] text-accent">
          <AnorMark className="h-6 w-auto" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{format(copy.label, { number })}</p>
          <h2 id="table-order-title" className="text-[20px] font-bold leading-tight text-ink">
            {copy.title}
          </h2>
          <p className="mt-1 text-[14px] leading-snug text-ink/70">{copy.lead}</p>
        </div>
      </div>
    </section>
  );
}
