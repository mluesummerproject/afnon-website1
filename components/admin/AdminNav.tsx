'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/components/admin/AdminLangProvider';

/** Six destinations, scrollable on a phone so every tab stays a single thumb-height row. */
export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const t = useT();
  const tabs = [
    { href: '/admin', label: t.nav.menu, active: pathname === '/admin' },
    { href: '/admin/videos', label: t.nav.films, active: pathname.startsWith('/admin/videos') },
    { href: '/admin/banners', label: t.nav.banners, active: pathname.startsWith('/admin/banners') },
    { href: '/admin/categories', label: t.nav.categories, active: pathname.startsWith('/admin/categories') },
    { href: '/admin/settings', label: t.nav.settings, active: pathname.startsWith('/admin/settings') },
    { href: '/admin/inbox', label: t.nav.inbox, active: pathname.startsWith('/admin/inbox'), badge: unread },
  ];

  return (
    <nav aria-label={t.nav.sections} className="shell">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={`relative flex min-h-[3rem] items-center justify-center gap-2 whitespace-nowrap px-3.5 text-label-lg font-medium uppercase transition-colors duration-quick md:px-4 ${
                tab.active ? 'text-anor-ink' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="figures inline-flex min-w-[1.4rem] items-center justify-center rounded-pill bg-anor px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-normal text-on-anor">
                  <span className="sr-only">, </span>
                  {tab.badge}
                  <span className="sr-only"> {t.nav.unread}</span>
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 bottom-0 h-0.5 bg-anor transition-opacity duration-quick ${tab.active ? 'opacity-100' : 'opacity-0'}`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
