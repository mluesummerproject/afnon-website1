/**
 * The basket — pure logic, no React, no storage access. It lives in the
 * browser until the visitor places an order (app/actions/order.ts), which
 * records it for staff and hands back one Telegram message.
 */

import { format } from '@/lib/i18n';
import { formatAmount } from '@/lib/menu-format';
import { telegramMessageUrl } from '@/lib/telegram';

export type BasketLine = { id: number; qty: number };
export type BasketDish = { id: number; name: string; priceValue: number | null; available: boolean };

export const BASKET_STORAGE_KEY = 'afnon_basket_v1';
export const MAX_QTY = 99;
/** Matches the order limit (lib/checkout.ts), so a basket the site lets you build can always be ordered. */
export const MAX_LINES = 50;

const clampQty = (qty: number) => Math.max(0, Math.min(MAX_QTY, Math.floor(qty)));

export function addItem(lines: BasketLine[], id: number, by = 1): BasketLine[] {
  const existing = lines.find((line) => line.id === id);
  if (existing) return setQuantity(lines, id, existing.qty + by);
  if (lines.length >= MAX_LINES || by <= 0) return lines;
  return [...lines, { id, qty: clampQty(by) }];
}

/** Sets a quantity; zero or less removes the line. Order of lines is kept. */
export function setQuantity(lines: BasketLine[], id: number, qty: number): BasketLine[] {
  const next = clampQty(qty);
  if (next === 0) return removeItem(lines, id);
  return lines.map((line) => (line.id === id ? { ...line, qty: next } : line));
}

export function removeItem(lines: BasketLine[], id: number): BasketLine[] {
  return lines.filter((line) => line.id !== id);
}

export function countItems(lines: BasketLine[]): number {
  return lines.reduce((total, line) => total + line.qty, 0);
}

export function serializeBasket(lines: BasketLine[]): string {
  return JSON.stringify(lines);
}

/**
 * Reads what was stored, trusting nothing: malformed JSON, wrong shapes,
 * duplicates, silly quantities and dishes that no longer exist (or are
 * unavailable today) are all dropped.
 */
export function parseStoredBasket(raw: string | null | undefined, orderable?: Set<number>): BasketLine[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  let lines: BasketLine[] = [];
  for (const entry of data.slice(0, MAX_LINES)) {
    if (!entry || typeof entry !== 'object') continue;
    const { id, qty } = entry as Record<string, unknown>;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) continue;
    if (typeof qty !== 'number' || !Number.isFinite(qty) || qty < 1) continue;
    if (orderable && !orderable.has(id)) continue;
    lines = addItem(lines, id, Math.min(qty, MAX_QTY));
  }
  return lines;
}

export type BasketTotal = { amount: number; complete: boolean };

/** Sum of priced lines; `complete` is false when some dish has no numeric price. */
export function basketTotal(lines: BasketLine[], dishes: Map<number, BasketDish>): BasketTotal {
  let amount = 0;
  let complete = true;
  for (const line of lines) {
    const dish = dishes.get(line.id);
    if (!dish || dish.priceValue === null) {
      complete = false;
      continue;
    }
    amount += dish.priceValue * line.qty;
  }
  return { amount: Math.round(amount * 100) / 100, complete };
}

export type OrderTemplates = {
  messageGreeting: string;
  messageLine: string;
  messageLinePrice: string;
  messageTotal: string;
};

/**
 * One localized, readable message:
 *   Salom! Men quyidagilarga buyurtma bermoqchiman:
 *   1. Palov × 2 — 130 000 soʻm
 *   2. Choy × 1
 *   Jami: 130 000 soʻm
 * A total line appears only when at least one dish has a numeric price.
 * A placed order adds its code after the greeting and its details (type,
 * phone, address, payment…) after the total, through `extra`.
 */
export function composeOrderMessage(
  lines: BasketLine[],
  dishes: Map<number, BasketDish>,
  templates: OrderTemplates,
  currency: string,
  extra: { afterGreeting?: string[]; afterTotal?: string[] } = {},
): string {
  const rows: string[] = [templates.messageGreeting, ...(extra.afterGreeting ?? [])];
  let index = 0;
  let priced = 0;

  for (const line of lines) {
    const dish = dishes.get(line.id);
    if (!dish) continue;
    index += 1;
    if (dish.priceValue !== null) {
      priced += 1;
      rows.push(
        format(templates.messageLinePrice, {
          index,
          dish: dish.name,
          qty: line.qty,
          amount: formatAmount(dish.priceValue * line.qty, currency, ' '),
        }),
      );
    } else {
      rows.push(format(templates.messageLine, { index, dish: dish.name, qty: line.qty }));
    }
  }

  if (priced > 0) {
    rows.push(format(templates.messageTotal, { amount: formatAmount(basketTotal(lines, dishes).amount, currency, ' ') }));
  }
  if (extra.afterTotal?.length) rows.push('', ...extra.afterTotal);
  return rows.join('\n');
}

export function orderUrl(message: string, username?: string): string {
  return telegramMessageUrl(message, username);
}
