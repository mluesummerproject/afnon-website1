import { redirect } from 'next/navigation';

import { AdminLangProvider } from '@/components/admin/AdminLangProvider';
import { AdminLanguageSwitch } from '@/components/admin/AdminLanguageSwitch';
import { LoginForm } from '@/components/admin/LoginForm';
import { AnorMark } from '@/components/ui/AnorMark';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { adminPasswordConfigured, isAuthenticated } from '@/lib/auth';
import { format } from '@/lib/i18n';
import { brand } from '@/lib/site';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { m?: string };
}) {
  if (isAuthenticated()) redirect('/admin');

  const { locale, dict } = getAdminLocaleAndDict();
  const notices: Record<string, string> = {
    expired: dict.login.expired,
    'signed-out': dict.login.signedOut,
    required: dict.login.required,
  };
  const notice = searchParams?.m ? notices[searchParams.m] : undefined;

  return (
    <AdminLangProvider locale={locale}>
      <main className="flex min-h-[100svh] items-center justify-center px-gutter py-16">
        <div className="w-full max-w-[24rem]">
          <div className="flex items-start justify-between gap-4">
            <AnorMark className="h-8 w-auto text-anor" />
            <AdminLanguageSwitch />
          </div>
          <h1 className="mt-7 font-display text-display-md text-ink">{brand.name}</h1>
          <p className="label mt-2 text-ink-muted">{dict.login.subtitle}</p>

          {adminPasswordConfigured ? (
            <LoginForm
              notice={notice}
              labels={{ password: dict.login.password, signIn: dict.login.signIn, checking: dict.login.checking }}
            />
          ) : (
            <div className="mt-8 border-l-2 border-critical bg-surface px-4 py-4">
              <p className="text-body-sm text-ink">{dict.login.notConfigured}</p>
              <p className="mt-3 text-body-sm text-ink-secondary">
                {format(dict.login.notConfiguredHint, { password: 'ADMIN_PASSWORD', file: '.env.local' })}
              </p>
            </div>
          )}

          <p className="mt-10 border-t border-line pt-5 text-micro text-ink-muted">{format(dict.login.footer, { brand: brand.name })}</p>
        </div>
      </main>
    </AdminLangProvider>
  );
}
