import Link from 'next/link';

import { EmptyState } from '@/components/site/EmptyState';
import { getLocaleAndDictionary } from '@/lib/locale';

export default function NotFound() {
  const { dict } = getLocaleAndDictionary();
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-page">
      <EmptyState kind="search" text={dict.notFound.title}>
        <p className="mt-1 text-[14px] text-ink/60">{dict.notFound.body}</p>
        <Link href="/" className="tap mt-5 inline-flex h-12 items-center rounded-[14px] bg-accent px-6 text-button text-white">
          {dict.notFound.back}
        </Link>
      </EmptyState>
    </main>
  );
}
