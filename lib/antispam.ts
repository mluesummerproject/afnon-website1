import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';

/**
 * Lightweight, invisible abuse protection for the public form — no CAPTCHA:
 *  · a signed render-time token (proves the form was loaded, and when)
 *  · a honeypot field humans never see
 *  · a per-visitor rate limit in memory, backed by a database check in the
 *    action itself (memory alone is per-instance on serverless hosts)
 */

function secret(): Buffer {
  const material = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.ADMIN_PASSWORD ?? 'afnon-dev-only';
  return createHmac('sha256', 'afnon.form-token.v1').update(material).digest();
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function issueFormToken(): string {
  const issued = Date.now().toString(36);
  return `${issued}.${sign(issued)}`;
}

/** The millisecond timestamp the token was issued at, or null if forged/garbled. */
export function readFormToken(token: unknown): number | null {
  if (typeof token !== 'string' || token.length > 100) return null;
  const [issued, signature] = token.split('.');
  if (!issued || !signature) return null;

  const expected = Buffer.from(sign(issued));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  const time = parseInt(issued, 36);
  return Number.isFinite(time) ? time : null;
}

/** A hashed visitor key — the raw IP is never stored or logged. */
export function visitorKey(): string {
  const list = headers();
  const ip = list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'unknown';
  const agent = list.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}|${agent}`).digest('base64url').slice(0, 24);
}

const hits = new Map<string, number[]>();

/** True when the visitor is still within `limit` submissions per window. */
export function withinRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [storedKey, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(storedKey);
    }
  }
  return true;
}
