import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/admin/actions';
import { AdminLangProvider } from '@/components/admin/AdminLangProvider';
import { AdminLanguageSwitch } from '@/components/admin/AdminLanguageSwitch';
import { AdminNav } from '@/components/admin/AdminNav';
import { HomeScreenHint } from '@/components/admin/HomeScreenHint';
import { OrderWatcher } from '@/components/admin/OrderWatcher';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { Toaster } from '@/components/admin/Toaster';
import { AnorMark } from '@/components/ui/AnorMark';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { getNewOrderCount, getUnreadCount, getUnreadFeedbackCount } from '@/lib/admin-data';
import { hasSessionCookie, isAuthenticated } from '@/lib/auth';
import { brand } from '@/lib/site';

/**
 * The route guard and the shared staff shell. Rendered on the server before
 * any dashboard page, so an unauthenticated request never reaches the data —
 * and every Server Action behind every control checks the session again.
 *
 * The header, home-screen hint and toaster carry `print:hidden` so that
 * printing the Tables tab's print view (a page inside this same protected
 * group, for a shared auth guard) shows only that page's own content.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) redirect(`/admin/login?m=${hasSessionCookie() ? 'expired' : 'required'}`);
  const [unreadMessages, unreadFeedback, newOrders] = await Promise.all([getUnreadCount(), getUnreadFeedbackCount(), getNewOrderCount()]);
  const unread = unreadMessages + unreadFeedback;
  const { locale, dict } = getAdminLocaleAndDict();

  return (
    <AdminLangProvider locale={locale}>
      <div className="pb-28 print:pb-0">
        <header className="sticky top-0 z-40 border-b border-line bg-paper print:hidden">
          <div className="shell flex h-14 items-center justify-between gap-3 md:h-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <AnorMark className="h-5 w-auto shrink-0 text-anor" />
              <span className="font-display text-[1.375rem] leading-none text-ink">{brand.name}</span>
              <span className="label hidden text-ink-muted sm:inline">{dict.shell.staff}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              <OrderWatcher />
              <AdminLanguageSwitch />
              <Link href="/" target="_blank" className="link-underline label hidden min-h-[2.75rem] items-center text-ink-secondary lg:inline-flex">
                {dict.shell.viewSite}
              </Link>
              <form action={logout}>
                <SubmitButton variant="secondary" pendingLabel={dict.shell.signingOut}>
                  {dict.shell.signOut}
                </SubmitButton>
              </form>
            </div>
          </div>
          <div className="border-t border-line">
            <AdminNav unread={unread} newOrders={newOrders} />
          </div>
        </header>
        <div className="print:hidden">
          <HomeScreenHint
            labels={{
              title: dict.homeScreen.title,
              ios: dict.homeScreen.ios,
              android: dict.homeScreen.android,
              dismiss: dict.homeScreen.dismiss,
            }}
          />
        </div>
        {children}
        <div className="print:hidden">
          <Toaster />
        </div>
      </div>
    </AdminLangProvider>
  );
}
