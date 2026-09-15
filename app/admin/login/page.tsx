import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/LoginForm';
import { AnorMark } from '@/components/ui/AnorMark';
import { adminPasswordConfigured, isAuthenticated } from '@/lib/auth';
import { brand } from '@/lib/site';

const notices: Record<string, string> = {
  expired: 'Your session has ended. Sign in again to keep editing.',
  'signed-out': 'You are signed out.',
  required: 'Sign in to open the menu manager.',
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { m?: string };
}) {
  if (isAuthenticated()) redirect('/admin');

  const notice = searchParams?.m ? notices[searchParams.m] : undefined;

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-gutter py-16">
      <div className="w-full max-w-[24rem]">
        <AnorMark className="h-8 w-auto text-anor" />
        <h1 className="mt-7 font-display text-display-md text-ink">{brand.name}</h1>
        <p className="label mt-2 text-ink-muted">Menu manager</p>

        {adminPasswordConfigured ? (
          <LoginForm notice={notice} />
        ) : (
          <div className="mt-8 border-l-2 border-critical bg-surface px-4 py-4">
            <p className="text-body-sm text-ink">
              The admin password has not been configured on the server.
            </p>
            <p className="mt-3 text-body-sm text-ink-secondary">
              Set <code className="text-ink">ADMIN_PASSWORD</code> in{' '}
              <code className="text-ink">.env.local</code> (and in the hosting environment), then
              restart the app.
            </p>
          </div>
        )}

        <p className="mt-10 border-t border-line pt-5 text-micro text-ink-muted">
          This area is for {brand.name} staff. Changes here appear on the public menu straight
          away.
        </p>
      </div>
    </main>
  );
}
