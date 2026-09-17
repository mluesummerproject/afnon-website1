import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
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

/**
 * The connecting client's IP, from the header the host itself sets.
 *
 * Netlify writes `x-nf-client-connection-ip` from the real TCP connection, so a
 * visitor cannot choose it. The leftmost `x-forwarded-for` entry, by contrast,
 * is whatever the client sent — trusting it first let anyone reset their own
 * rate limit by inventing a new address on every request. It stays only as a
 * last resort for hosts that set nothing better (and for local development).
 */
function clientIp(): string {
  const list = headers();
  return (
    list.get('x-nf-client-connection-ip')?.trim() ||
    list.get('x-real-ip')?.trim() ||
    list.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * A keyed hash of the client IP. The raw IP is never stored or logged, and
 * because the hash is keyed with a server secret, a stored value cannot be
 * turned back into an address by hashing every IPv4 address and comparing.
 *
 * Deliberately not mixed with the user agent: that is another header the
 * client writes, so including it would hand out a fresh limit per invented
 * browser string.
 */
export function visitorKey(): string {
  return createHmac('sha256', secret()).update(`visitor|${clientIp()}`).digest('base64url').slice(0, 32);
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
