import type { Metadata } from 'next';

import { brand } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Menu manager',
  robots: { index: false, follow: false },
};

/** The admin is always live data — never served from a cache. */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-paper">
      <span className="sr-only">{brand.name} staff area</span>
      {children}
    </div>
  );
}
