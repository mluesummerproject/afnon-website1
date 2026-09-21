'use server';

import { readFormToken, readSignedValue, signValue, visitorKey, withinRateLimit } from '@/lib/antispam';
import { cleanOrderLines, snapshotTotal, validateDetails, type OrderField, type OrderItemSnapshot } from '@/lib/checkout';
import { isLocale, localizedText, type Locale } from '@/lib/i18n';
import { parseAmount } from '@/lib/menu-format';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import { resolveTableByToken, tableOrderingAvailable } from '@/lib/tables-server';
import type { MenuItem } from '@/lib/types';

export type PlaceOrderInput = {
  token: unknown;
  company: unknown;
  locale: unknown;
  fulfillment: unknown;
  /** For a table order only: the token from the table's QR code. The table itself is always looked up here. */
  tableToken?: unknown;
  phone: unknown;
  name: unknown;
  address: unknown;
  addressNote: unknown;
  geo: unknown;
  lines: unknown;
  /** The total the visitor saw on the review step; a mismatch means prices changed underneath them. */
  expectedTotal: unknown;
};

export type PlacedOrder = {
  code: string;
  items: OrderItemSnapshot[];
  total: number;
  /** null for a table order — those are placed from the table, with no phone. */
  phone: string | null;
  /** The table's number for a table order, as it was when the order was placed. */
  table: string | null;
  /** Proof this browser placed the order — the only thing that may mark it as sent to Telegram. */
  receipt: string;
};

export type PlaceOrderResult =
  | { status: 'ok'; order: PlacedOrder }
  | { status: 'error'; reason: 'fields'; invalid: OrderField[] }
  | { status: 'error'; reason: 'basketChanged' | 'rateLimited' | 'expired' | 'tableUnavailable' | 'generic' };

const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const MIN_FILL_MS = 2500;
const RECEIPT = 'order-receipt';

// Throttles: memory first (cheap, per instance), then the database (holds across instances).
const MEMORY_WINDOW_MS = 10 * 60 * 1000;
const MEMORY_LIMIT = 8; // attempts, not orders: a retry after a dropped connection must still get through
const DB_WINDOW_MS = 30 * 60 * 1000;
const DB_LIMIT_PER_PHONE = 3;
const DB_LIMIT_PER_VISITOR = 20;
/** The same phone sending the same dishes this soon is a double tap or a resubmit, not a new order. */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

// Table orders are throttled per TABLE, not per address: everyone in the restaurant shares one Wi-Fi
// address, so an address-wide limit would lock the whole room out after a few tables had ordered.
const TABLE_LIMIT_PER_VISITOR = 4; // orders from one device/address at one table, per window
const TABLE_LIMIT_PER_TABLE = 12; // orders at one table, per window
/** Shorter than for phone orders: two friends at one table may each order the same single dish. */
const TABLE_DUPLICATE_WINDOW_MS = 45 * 1000;

const fail = (reason: 'basketChanged' | 'rateLimited' | 'expired' | 'tableUnavailable' | 'generic'): PlaceOrderResult => ({ status: 'error', reason });

const sameItems = (a: OrderItemSnapshot[], b: OrderItemSnapshot[]) => {
  const key = (items: OrderItemSnapshot[]) => items.map((item) => `${item.id}x${item.qty}`).sort().join(',');
  return key(a) === key(b);
};

/**
 * Records a cash order for staff, then hands the browser what it needs for the
 * confirmation screen and the optional Telegram message.
 *
 * The browser only ever supplies dish ids and quantities: names and prices are
 * read here from menu_items, so the stored total is the restaurant's, not the
 * visitor's. Writes use the service-role key, server-side — the public key has
 * no access to `orders` at all. Returns reason codes, never database text.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input || typeof input !== 'object') return fail('generic');
  if (!isAdminSupabaseConfigured) return fail('generic');

  // Bots: a filled honeypot, a forged token, or a three-step form "filled" in under 2.5s.
  // Answered with an error, never a fake confirmation — no order number is ever invented.
  if (typeof input.company === 'string' && input.company.trim() !== '') return fail('generic');
  const issued = readFormToken(input.token);
  if (issued === null) return fail('generic');
  const age = Date.now() - issued;
  if (age > MAX_TOKEN_AGE_MS) return fail('expired');
  if (age < MIN_FILL_MS) return fail('generic');

  const { values, invalid } = validateDetails({
    fulfillment: input.fulfillment,
    phone: input.phone,
    name: input.name,
    address: input.address,
    addressNote: input.addressNote,
    geo: input.geo,
  });
  if (!values) return { status: 'error', reason: 'fields', invalid };

  const lines = cleanOrderLines(input.lines);
  if (!lines) return fail('basketChanged');
  const locale: Locale = isLocale(input.locale) ? input.locale : 'uz';

  const visitor = visitorKey();

  // A table order names its table by the QR token alone. The number, and whether the table exists and is
  // active, come from the database here — nothing about the table is ever taken from the browser.
  let table: { id: number; tableNumber: string } | null = null;
  if (values.fulfillment === 'table') {
    if (!withinRateLimit(`order-table-lookup:${visitor}`, 30, MEMORY_WINDOW_MS)) return fail('rateLimited');
    const token = typeof input.tableToken === 'string' ? input.tableToken : '';
    const [available, resolved] = await Promise.all([tableOrderingAvailable(), resolveTableByToken(token)]);
    if (!available || !resolved) return fail('tableUnavailable');
    table = resolved;
  }

  const attemptKey = table ? `order:table:${table.id}:${visitor}` : `order:${visitor}`;
  if (!withinRateLimit(attemptKey, MEMORY_LIMIT, MEMORY_WINDOW_MS)) return fail('rateLimited');

  const supabase = getSupabaseAdmin();

  // Prices and availability as they are right now.
  const { data: rows, error: menuError } = await supabase
    .from('menu_items')
    .select('id, name, name_uz, name_ru, name_en, description, description_uz, description_ru, description_en, price, is_available')
    .in(
      'id',
      lines.map((line) => line.id),
    );
  if (menuError || !rows) {
    console.error('[order] menu read failed with code', menuError?.code);
    return fail('generic');
  }

  const byId = new Map((rows as MenuItem[]).map((row) => [row.id, row]));
  const items: OrderItemSnapshot[] = [];
  for (const line of lines) {
    const row = byId.get(line.id);
    const unitPrice = row ? parseAmount(row.price) : null;
    const name = row ? localizedText(row, 'name', locale) : null;
    if (!row || row.is_available === false || unitPrice === null || !name) return fail('basketChanged');
    items.push({ id: row.id, name, unit_price: unitPrice, qty: line.qty });
  }
  const total = snapshotTotal(items);
  if (typeof input.expectedTotal !== 'number' || Math.abs(input.expectedTotal - total) > 0.005) return fail('basketChanged');

  // Cross-instance throttle + double-submit guard, read with the server-only client.
  const since = new Date(Date.now() - DB_WINDOW_MS).toISOString();

  if (table) {
    const recent = await supabase
      .from('orders')
      .select('id, order_code, items, total, created_at, visitor_key')
      .eq('table_id', table.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    if (recent.error) {
      console.error('[order] table throttle read failed with code', recent.error.code);
      return fail('generic');
    }
    const rows = recent.data ?? [];
    const repeat = rows.find(
      (order) =>
        order.visitor_key === visitor && Date.now() - new Date(order.created_at).getTime() < TABLE_DUPLICATE_WINDOW_MS && sameItems(order.items as OrderItemSnapshot[], items),
    );
    if (repeat) {
      return {
        status: 'ok',
        order: { code: repeat.order_code, items: repeat.items as OrderItemSnapshot[], total: Number(repeat.total), phone: null, table: table.tableNumber, receipt: signValue(RECEIPT, String(repeat.id)) },
      };
    }
    if (rows.filter((order) => order.visitor_key === visitor).length >= TABLE_LIMIT_PER_VISITOR || rows.length >= TABLE_LIMIT_PER_TABLE) return fail('rateLimited');

    const placedAtTable = await supabase
      .from('orders')
      .insert({
        fulfillment_type: 'table',
        table_id: table.id,
        table_number: table.tableNumber,
        customer_name: null,
        phone: null,
        items,
        total,
        payment_method: 'cash',
        language: locale,
        visitor_key: visitor,
      })
      .select('id, order_code')
      .single();
    if (placedAtTable.error || !placedAtTable.data) {
      console.error('[order] table insert failed with code', placedAtTable.error?.code);
      return fail('generic');
    }
    return {
      status: 'ok',
      order: { code: placedAtTable.data.order_code, items, total, phone: null, table: table.tableNumber, receipt: signValue(RECEIPT, String(placedAtTable.data.id)) },
    };
  }

  // Delivery and pickup always carry a validated phone (a table order returned above).
  const phone = values.phone as string;
  const [byPhone, byVisitor] = await Promise.all([
    supabase.from('orders').select('id, order_code, items, total, created_at').eq('phone', phone).gte('created_at', since).order('created_at', { ascending: false }).limit(10),
    // Table orders share the restaurant's address and have their own per-table limit above, so they do not count here.
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('visitor_key', visitor).neq('fulfillment_type', 'table').gte('created_at', since),
  ]);
  if (byPhone.error || byVisitor.error) {
    console.error('[order] throttle read failed with code', byPhone.error?.code ?? byVisitor.error?.code);
    return fail('generic');
  }

  const duplicate = (byPhone.data ?? []).find(
    (order) => Date.now() - new Date(order.created_at).getTime() < DUPLICATE_WINDOW_MS && sameItems(order.items as OrderItemSnapshot[], items),
  );
  if (duplicate) {
    return {
      status: 'ok',
      order: { code: duplicate.order_code, items: duplicate.items as OrderItemSnapshot[], total: Number(duplicate.total), phone, table: null, receipt: signValue(RECEIPT, String(duplicate.id)) },
    };
  }
  if ((byPhone.data?.length ?? 0) >= DB_LIMIT_PER_PHONE || (byVisitor.count ?? 0) >= DB_LIMIT_PER_VISITOR) return fail('rateLimited');

  const { data: created, error: insertError } = await supabase
    .from('orders')
    .insert({
      fulfillment_type: values.fulfillment,
      customer_name: values.name,
      phone,
      address: values.address,
      address_note: values.addressNote,
      geo_lat: values.geo?.lat ?? null,
      geo_lng: values.geo?.lng ?? null,
      items,
      total,
      payment_method: 'cash',
      language: locale,
      visitor_key: visitor,
    })
    .select('id, order_code')
    .single();

  if (insertError || !created) {
    console.error('[order] insert failed with code', insertError?.code);
    return fail('generic');
  }

  return {
    status: 'ok',
    order: { code: created.order_code, items, total, phone, table: null, receipt: signValue(RECEIPT, String(created.id)) },
  };
}

/**
 * Notes that the visitor opened the prefilled Telegram message. Only the
 * browser that placed the order holds a valid receipt, so order codes (which
 * are sequential and easy to guess) cannot be used to flip other orders.
 * Best effort: a failure here never bothers the visitor.
 */
export async function markTelegramOpened(receipt: unknown): Promise<boolean> {
  const value = readSignedValue(RECEIPT, receipt);
  const id = value ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0 || !isAdminSupabaseConfigured) return false;
  const { error } = await getSupabaseAdmin().from('orders').update({ telegram_opened: true }).eq('id', id);
  if (error) console.error('[order] telegram flag failed with code', error.code);
  return !error;
}
