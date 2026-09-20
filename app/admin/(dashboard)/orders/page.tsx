import type { Metadata } from 'next';
import Link from 'next/link';

import { deleteOrder } from '@/app/admin/order-actions';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { DeleteRecord } from '@/components/admin/DeleteRecord';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { getOrderCounts, getOrders, ORDERS_PAGE_SIZE } from '@/lib/admin-data';
import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { displayUzPhone, mapsLink } from '@/lib/checkout';
import { format, getDictionary, localeMeta } from '@/lib/i18n';
import { formatAmount } from '@/lib/menu-format';
import { isOrderStatus, ORDER_STATUSES, type OrderStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Orders' };

export default async function OrdersPage({ searchParams }: { searchParams?: { status?: string; page?: string } }) {
  const filter: OrderStatus | 'all' = isOrderStatus(searchParams?.status) ? searchParams.status : 'all';
  const page = Math.max(1, Math.floor(Number(searchParams?.page) || 1));
  const [{ orders, total, error }, counts] = await Promise.all([getOrders(filter, page), getOrderCounts()]);
  const pages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const { locale, dict: t } = getAdminLocaleAndDict();
  const currency = getDictionary(locale).menu.currency;

  // Times read in the panel's language, always in the restaurant's own time zone.
  const timeFormat = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const allCount = ORDER_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const tabs: { key: OrderStatus | 'all'; label: string; count: number; href: string }[] = [
    { key: 'all', label: t.orders.all, count: allCount, href: '/admin/orders' },
    ...ORDER_STATUSES.map((status) => ({ key: status, label: t.orders.statuses[status], count: counts[status], href: `/admin/orders?status=${status}` })),
  ];
  const pageHref = (target: number) => `/admin/orders?${filter !== 'all' ? `status=${filter}&` : ''}page=${target}`;

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.orders.title}</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">{t.orders.subtitle}</p>

      <div className="-mx-gutter mt-6 overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2" role="group" aria-label={t.orders.show}>
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`tap flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-hair border px-3.5 text-body-sm transition-colors duration-quick ${
                  active ? 'border-anor bg-anor text-paper' : 'border-line-strong bg-surface text-ink hover:border-anor/50 hover:bg-anor-tint/40'
                }`}
              >
                {tab.label}
                <span
                  className={`figures rounded-pill px-1.5 text-micro font-semibold ${
                    active ? 'bg-paper/20' : tab.key === 'new' && tab.count > 0 ? 'bg-anor-tint text-anor' : 'bg-paper-alt text-ink-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      {!error && orders.length === 0 ? (
        <AdminEmpty rule title={filter === 'all' ? t.orders.emptyTitle : t.orders.emptyFilteredTitle}>{filter === 'all' ? t.orders.emptyBody : t.orders.emptyFilteredBody}</AdminEmpty>
      ) : null}

      <ul className="mt-6 space-y-3">
        {orders.map((order) => {
          const fresh = order.status === 'new';
          const delivery = order.fulfillment_type === 'delivery';
          const phone = displayUzPhone(order.phone);
          const geo = order.geo_lat !== null && order.geo_lng !== null ? mapsLink({ lat: Number(order.geo_lat), lng: Number(order.geo_lng) }) : null;
          return (
            <li key={order.id}>
              <article
                aria-label={order.order_code}
                className={`rounded-hair border bg-surface p-4 transition-shadow duration-base ease-brand hover:shadow-panel md:p-5 ${fresh ? 'border-anor/40 border-l-4 border-l-anor' : 'border-line'}`}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="figures font-display text-[1.5rem] font-bold leading-none tracking-[0.02em] text-ink">{order.order_code}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-ink-secondary">
                      <time dateTime={order.created_at} className="figures">
                        {timeFormat.format(new Date(order.created_at))}
                      </time>
                      <span aria-hidden="true" className="text-line-strong">·</span>
                      <span className={`label rounded-hair px-1.5 py-1 ${delivery ? 'bg-anor-tint text-anor' : 'bg-paper-alt text-ink-secondary'}`}>{delivery ? t.orders.delivery : t.orders.pickup}</span>
                    </p>
                  </div>
                  <OrderStatusSelect id={order.id} code={order.order_code} status={order.status} />
                </header>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={`tel:${order.phone}`}
                    aria-label={format(t.orders.call, { phone })}
                    className="tap figures inline-flex min-h-[2.75rem] items-center gap-2 rounded-hair bg-anor px-4 text-body font-semibold text-paper hover:bg-anor-hover"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6.6 3.5h2.6l1.5 4-2 1.3a11.3 11.3 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
                    </svg>
                    {phone}
                  </a>
                  <span className={`text-body-sm ${order.customer_name ? 'text-ink' : 'text-ink-muted'}`}>{order.customer_name ?? t.orders.noName}</span>
                </div>

                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 text-body-sm">
                      <span className="min-w-0 text-ink">
                        {/* Straight to that dish in the Menu tab (its row carries id="dish-{id}"). */}
                        <Link href={`/admin#dish-${item.id}`} className="underline-offset-4 transition-colors duration-quick hover:text-anor hover:underline">
                          {item.name}
                        </Link>{' '}
                        <span className="figures font-semibold text-ink-muted">× {item.qty}</span>
                      </span>
                      <span className="figures shrink-0 text-ink-secondary">{formatAmount(Number(item.unit_price) * item.qty, currency)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="text-body-sm font-semibold text-ink">
                    {t.orders.total} <span className="font-normal text-ink-muted">· {t.orders.cash}</span>
                  </span>
                  <span className="figures text-[1.125rem] font-bold text-anor">{formatAmount(Number(order.total), currency)}</span>
                </p>

                {delivery && order.address ? (
                  <div className="mt-4 rounded-hair bg-paper-alt px-3.5 py-3">
                    <p className="break-words text-body-sm text-ink">{order.address}</p>
                    {order.address_note ? <p className="mt-0.5 break-words text-micro text-ink-secondary">{order.address_note}</p> : null}
                    {geo ? (
                      <a href={geo} target="_blank" rel="noreferrer noopener" className="tap mt-2 inline-flex min-h-[2.75rem] items-center gap-1.5 text-body-sm font-semibold text-anor underline underline-offset-2">
                        {t.orders.openMap}
                      </a>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-micro text-ink-muted">
                  {order.language ? <span>{format(t.orders.language, { language: localeMeta[order.language].name })}</span> : null}
                  {order.telegram_opened ? <span>{t.orders.telegramSent}</span> : null}
                </p>

                <div className="mt-3 flex justify-end border-t border-line pt-3">
                  <DeleteRecord action={deleteOrder.bind(null, order.id)} confirmText={format(t.orders.deleteConfirm, { code: order.order_code })} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {pages > 1 ? (
        <nav aria-label={t.inbox.pages} className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="tap min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
              {t.inbox.newer}
            </Link>
          ) : (
            <span />
          )}
          <span className="figures text-micro text-ink-muted">{format(t.inbox.pageOf, { page, pages })}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="tap min-h-[2.75rem] rounded-hair border border-line-strong px-4 py-3 text-body-sm">
              {t.inbox.older}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
