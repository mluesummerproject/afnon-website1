import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth';
import { BANNERS_CACHE_TAG, MENU_CACHE_TAG, SETTINGS_CACHE_TAG, VIDEOS_CACHE_TAG } from '@/lib/supabase';

import type { ActionResult } from '@/lib/admin-types';

export type { ActionResult };

export function succeed(message: string, id?: number): NonNullable<ActionResult> {
  return { ok: true, message, id, at: Date.now() };
}

export function fail(message: string): NonNullable<ActionResult> {
  return { ok: false, message, at: Date.now() };
}

/**
 * The real authorization boundary. Every admin Server Action calls this first —
 * hiding the UI is never relied on.
 */
export function requireAdmin(): void {
  if (!isAuthenticated()) redirect('/admin/login?m=expired');
}

/** Busts every public cache and re-renders all routes, so edits are live at once. */
export function refreshSite(): void {
  revalidateTag(MENU_CACHE_TAG);
  revalidateTag(VIDEOS_CACHE_TAG);
  revalidateTag(BANNERS_CACHE_TAG);
  revalidateTag(SETTINGS_CACHE_TAG);
  revalidatePath('/', 'layout');
}

/** Positive database id or null — never trust a client-supplied number. */
export function toId(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(typeof value === 'string' ? value.trim() : NaN);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

/** A trimmed string field with control characters removed; '' when absent. */
export function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim() : '';
}
