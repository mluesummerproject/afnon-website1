'use server';

import { readFormToken, visitorKey, withinRateLimit } from '@/lib/antispam';
import { validateContact, type ContactField, type ContactValues } from '@/lib/contact';
import { getSupabaseAdmin, isAdminSupabaseConfigured } from '@/lib/supabase-admin';
import { supabasePublicWriter } from '@/lib/supabase';

export type ContactState =
  | { status: 'idle' }
  | { status: 'success'; name: string; contact: string }
  | { status: 'error'; reason: 'fields' | 'rateLimited' | 'generic'; invalid: ContactField[]; values: ContactValues };

const MIN_FILL_MS = 2500;
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Receives a visitor's message. Returns codes, never text, so the visitor's
 * own language decides the wording — and never an internal database error.
 */
export async function sendMessage(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const raw = {
    name: formData.get('name'),
    contact: formData.get('contact'),
    message: formData.get('message'),
  };

  // Oversized or non-text payloads are rejected before anything else happens.
  const rawSize = [raw.name, raw.contact, raw.message].reduce<number>(
    (total, value) => total + (typeof value === 'string' ? value.length : 10_000),
    0,
  );
  const { values, invalid } = validateContact(raw);
  if (rawSize > 4000) return { status: 'error', reason: 'fields', invalid: ['message'], values };

  // Honeypot: a real visitor never fills this. Answer as if it worked.
  const trap = formData.get('company');
  if (typeof trap === 'string' && trap.trim() !== '') {
    return { status: 'success', name: values.name, contact: values.contact };
  }

  // Field problems are reported first, so a person who taps Send too early
  // sees what is missing rather than a false confirmation.
  if (invalid.length > 0) return { status: 'error', reason: 'fields', invalid, values };

  const issued = readFormToken(formData.get('token'));
  const age = issued === null ? -1 : Date.now() - issued;
  if (issued === null || age > MAX_TOKEN_AGE_MS) return { status: 'error', reason: 'generic', invalid: [], values };
  // A complete, valid form filled faster than a person can type: a bot. Answer quietly.
  if (age < MIN_FILL_MS) return { status: 'success', name: values.name, contact: values.contact };

  if (!withinRateLimit(visitorKey(), 5, WINDOW_MS)) {
    return { status: 'error', reason: 'rateLimited', invalid: [], values };
  }

  // Cross-instance protection, read with the server-only client (the public
  // key deliberately has no read access to messages).
  if (isAdminSupabaseConfigured) {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data: recent } = await getSupabaseAdmin()
      .from('messages')
      .select('message')
      .eq('contact', values.contact)
      .gte('created_at', since)
      .limit(10);

    if (recent?.some((row) => row.message === values.message)) {
      // The same message twice — a double tap or a resubmit. Already received.
      return { status: 'success', name: values.name, contact: values.contact };
    }
    if ((recent?.length ?? 0) >= 3) return { status: 'error', reason: 'rateLimited', invalid: [], values };
  }

  // Only these three fields are ever inserted, through the public insert policy.
  const { error } = await supabasePublicWriter.from('messages').insert({
    name: values.name,
    contact: values.contact,
    message: values.message,
  });

  if (error) {
    console.error('[contact] insert failed with code', error.code);
    return { status: 'error', reason: 'generic', invalid: [], values };
  }

  return { status: 'success', name: values.name, contact: values.contact };
}
