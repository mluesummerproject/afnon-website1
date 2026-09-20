'use client';

import { LayoutGroup, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/components/admin/AdminLangProvider';

/** Eight destinations, scrollable on a phone so every tab stays a single thumb-height row. */
export function AdminNav({ unread, newOrders }: { unread: number; newOrders: number }) {
  const pathname = usePathname();
  const t = useT();
  const tabs = [
    { href: '/admin', label: t.nav.menu, active: pathname === '/admin' },
    { href: '/admin/orders', label: t.nav.orders, active: pathname.startsWith('/admin/orders'), badge: newOrders, badgeLabel: t.nav.newOrders },
    { href: '/admin/videos', label: t.nav.films, active: pathname.startsWith('/admin/videos') },
    { href: '/admin/banners', label: t.nav.banners, active: pathname.startsWith('/admin/banners') },
    { href: '/admin/categories', label: t.nav.categories, active: pathname.startsWith('/admin/categories') },
    { href: '/admin/comments', label: t.nav.comments, active: pathname.startsWith('/admin/comments') },
    { href: '/admin/tables', label: t.nav.tables, active: pathname.startsWith('/admin/tables') },
    { href: '/admin/settings', label: t.nav.settings, active: pathname.startsWith('/admin/settings') },
    { href: '/admin/inbox', label: t.nav.inbox, active: pathname.startsWith('/admin/inbox'), badge: unread, badgeLabel: t.nav.unread },
  ];

  return (
    <nav aria-label={t.nav.sections} className="shell">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
        <LayoutGroup id="admin-nav">
        {tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={`relative flex min-h-[3rem] items-center justify-center gap-2 whitespace-nowrap px-3.5 text-label-lg font-medium uppercase transition-colors duration-quick md:px-4 ${
                tab.active ? 'text-anor' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="figures inline-flex min-w-[1.4rem] items-center justify-center rounded-pill bg-anor px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-normal text-paper">
                  <span className="sr-only">, </span>
                  {tab.badge}
                  <span className="sr-only"> {tab.badgeLabel}</span>
                </span>
              ) : null}
              {tab.active ? (
                // One shared underline slides between tabs — the same layoutId pattern as the site's own nav.
                <motion.span
                  layoutId="admin-nav-indicator"
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 bg-anor"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              ) : null}
            </Link>
          </li>
        ))}
        </LayoutGroup>
        {/* The header's "view site" link is desktop-only; on a phone it lives at the end of the tab row. */}
        <li className="shrink-0 lg:hidden">
          <Link
            href="/"
            target="_blank"
            className="tap flex min-h-[3rem] items-center justify-center gap-1.5 whitespace-nowrap px-3.5 text-label-lg font-medium uppercase text-ink-secondary hover:text-ink"
          >
            {t.shell.viewSite}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
