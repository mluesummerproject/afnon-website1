import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { Toaster } from '@/components/admin/Toaster';
import { AnorMark } from '@/components/ui/AnorMark';
import { getUnreadCount } from '@/lib/admin-data';
import { isAuthenticated } from '@/lib/auth';
import { brand } from '@/lib/site';

/**
 * The route guard and the shared staff shell. Rendered on the server before
 * any dashboard page, so an unauthenticated request never reaches the data —
 * and every Server Action behind every control checks the session again.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) redirect('/admin/login?m=required');
  const unread = await getUnreadCount();

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="shell flex h-14 items-center justify-between gap-3 md:h-16">
          <div className="flex items-center gap-2.5">
            <AnorMark className="h-5 w-auto text-anor" />
            <span className="font-display text-[1.375rem] leading-none text-ink">{brand.name}</span>
            <span className="label text-ink-muted">Staff</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" target="_blank" className="link-underline label hidden min-h-[2.75rem] items-center text-ink-secondary sm:inline-flex">
              View site ↗
            </Link>
            <form action={logout}>
              <SubmitButton variant="secondary" pendingLabel="…">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="border-t border-line">
          <AdminNav unread={unread} />
        </div>
      </header>
      {children}
      <Toaster />
    </div>
  );
}
