'use server';

import { readFormToken, visitorKey, withinRateLimit } from '@/lib/antispam';
import { isLocale } from '@/lib/i18n';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import { resolveTableByToken } from '@/lib/tables-server';

export type FeedbackState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; reason: 'empty' | 'rateLimited' | 'generic' };

const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const MIN_FILL_MS = 2500;
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 3;

const clean = (value: FormDataEntryValue | null, max: number) =>
  (typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').trim() : '').slice(0, max);

/**
 * Records one visit review. table_id is resolved here, server-side, from the
 * QR token — never read from the form — so a submission can only ever land
 * against a table that genuinely exists and is active. Anonymous is the
 * default; choosing to identify still has the server discard the identity
 * fields if the anonymous flag stayed on, so a tampered form can never
 * smuggle a name or phone past what the visitor actually chose.
 */
export async function sendFeedback(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const rawRating = Number(formData.get('rating'));
  const rating = Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : null;
  const comment = clean(formData.get('comment'), 2000);
  const isAnonymous = formData.get('anonymous') !== 'false';
  const name = isAnonymous ? null : clean(formData.get('name'), 120) || null;
  const phone = isAnonymous ? null : clean(formData.get('phone'), 32) || null;
  const localeValue = formData.get('locale');
  const language = isLocale(localeValue) ? localeValue : null;
  const tableToken = clean(formData.get('tableToken'), 64);

  if (!rating && !comment) return { status: 'error', reason: 'empty' };

  // Honeypot: a real visitor never fills this. Answer as if it worked.
  const trap = formData.get('company');
  if (typeof trap === 'string' && trap.trim() !== '') return { status: 'success' };

  const issued = readFormToken(formData.get('token'));
  const age = issued === null ? -1 : Date.now() - issued;
  if (issued === null || age > MAX_TOKEN_AGE_MS) return { status: 'error', reason: 'generic' };
  if (age < MIN_FILL_MS) return { status: 'success' };

  if (!withinRateLimit(`feedback:${visitorKey()}`, LIMIT, WINDOW_MS)) {
    return { status: 'error', reason: 'rateLimited' };
  }

  if (!isAdminSupabaseConfigured) return { status: 'error', reason: 'generic' };

  let tableId: number | null = null;
  if (tableToken) {
    const table = await resolveTableByToken(tableToken);
    if (!table) return { status: 'error', reason: 'generic' };
    tableId = table.id;
  }

  const { error } = await getSupabaseAdmin().from('feedback').insert({
    table_id: tableId,
    overall_rating: rating,
    comment: comment || null,
    is_anonymous: isAnonymous,
    name,
    phone,
    language,
    visitor_key: visitorKey(),
  });

  if (error) {
    console.error('[feedback] insert failed with code', error.code);
    return { status: 'error', reason: 'generic' };
  }

  return { status: 'success' };
}
