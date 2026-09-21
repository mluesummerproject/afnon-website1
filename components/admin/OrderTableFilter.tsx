'use client';

import { useRouter } from 'next/navigation';

/** The "which table" picker for the Orders tab: a native select (best on a phone) that changes the URL. */
export function OrderTableFilter({
  label,
  allLabel,
  numbers,
  value,
  hrefFor,
}: {
  label: string;
  allLabel: string;
  numbers: string[];
  value: string | null;
  /** The Orders URL for a table number (null = all tables), keeping the other filters. */
  hrefFor: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2">
      <span className="label text-ink-muted">{label}</span>
      <span className="relative">
        <select
          value={value ?? ''}
          onChange={(event) => router.push(hrefFor[event.target.value] ?? hrefFor[''])}
          className="figures min-h-[2.75rem] appearance-none rounded-hair border border-line-strong bg-surface py-2 pl-3.5 pr-9 text-body-sm text-ink transition-colors duration-quick hover:border-anor/50 focus:border-anor focus:outline-none"
        >
          <option value="">{allLabel}</option>
          {numbers.map((number) => (
            <option key={number} value={number}>
              {number}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
