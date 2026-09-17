import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/admin/actions';
import { AdminLangProvider } from '@/components/admin/AdminLangProvider';
import { AdminLanguageSwitch } from '@/components/admin/AdminLanguageSwitch';
import { AdminNav } from '@/components/admin/AdminNav';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { Toaster } from '@/components/admin/Toaster';
import { AnorMark } from '@/components/ui/AnorMark';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { getUnreadCount } from '@/lib/admin-data';
import { isAuthenticated } from '@/lib/auth';
import { brand } from '@/lib/site';
import { getTheme } from '@/lib/theme-server';

/**
 * The route guard and the shared staff shell. Rendered on the server before
 * any dashboard page, so an unauthenticated request never reaches the data —
 * and every Server Action behind every control checks the session again.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) redirect('/admin/login?m=required');
  const unread = await getUnreadCount();
  const { locale, dict } = getAdminLocaleAndDict();

  return (
    <AdminLangProvider locale={locale}>
      <div className="pb-28">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="shell flex h-14 items-center justify-between gap-3 md:h-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <AnorMark className="h-5 w-auto shrink-0 text-anor-ink" />
              <span className="font-display text-[1.375rem] leading-none text-ink">{brand.name}</span>
              <span className="label hidden text-ink-muted sm:inline">{dict.shell.staff}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              <AdminLanguageSwitch />
              <ThemeToggle
                initial={getTheme()}
                labels={{ toMidnight: dict.shell.toMidnight, toClassic: dict.shell.toClassic }}
                className="flex min-h-[2.75rem] w-11 shrink-0 items-center justify-center rounded-hair border border-line-strong bg-surface text-ink-secondary transition-colors duration-quick hover:border-ink hover:text-ink"
              />
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
            <AdminNav unread={unread} />
          </div>
        </header>
        {children}
        <Toaster />
      </div>
    </AdminLangProvider>
  );
}
