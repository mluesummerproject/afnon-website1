import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth';

/**
 * The route guard. Rendered on the server before any dashboard page, so an
 * unauthenticated request never reaches the data — and the server actions
 * behind every control check the session again for themselves.
 */
export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) redirect('/admin/login?m=required');
  return <>{children}</>;
}
