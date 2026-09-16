/** Discount maths — pure. */

import { formatPrice, parseAmount } from '@/lib/menu-format';

/** A number from a numeric column (number or numeric string); null otherwise. */
export function toAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value === 'string') return parseAmount(value);
  return null;
}

/**
 * The whole-number percentage saved, or null when there is no real discount:
 * no old price, no numeric price, an old price that is not greater, or a
 * saving so small it would round to 0 — so a "−0%" ribbon can never appear.
 */
export function discountPercent(price: number | null, oldPrice: number | null): number | null {
  if (price === null || oldPrice === null) return null;
  if (!(oldPrice > price) || oldPrice <= 0 || price < 0) return null;
  const percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  return percent >= 1 ? percent : null;
}

export type DishPricing = {
  price: string | null;
  priceValue: number | null;
  oldPriceValue: number | null;
  discountPercent: number | null;
};

export function dishPricing(priceText: string | null, oldPrice: unknown, currency: string): DishPricing {
  const priceValue = parseAmount(priceText);
  const old = toAmount(oldPrice);
  const percent = discountPercent(priceValue, old);
  return {
    price: formatPrice(priceText, currency),
    priceValue,
    oldPriceValue: percent === null ? null : old,
    discountPercent: percent,
  };
}
