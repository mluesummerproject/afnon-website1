import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin session.
 *
 * The password itself never leaves the server: it is read from ADMIN_PASSWORD,
 * compared in constant time, and then discarded. What the browser receives is
 * an httpOnly cookie containing `expiry.nonce.signature`, signed with a key
 * derived from the password — so changing ADMIN_PASSWORD invalidates every
 * outstanding session, and a cookie cannot be forged without the password.
 */

const COOKIE_NAME = 'afnon_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // one shift

export const adminPasswordConfigured = Boolean(process.env.ADMIN_PASSWORD);

function getPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD is not set.');
  return password;
}

/** Signing key — derived from the password, never the password itself. */
function signingKey(): Buffer {
  return createHmac('sha256', 'afnon.session.v1').update(getPassword()).digest();
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  // Compare fixed-length digests so length never leaks through timing.
  const digestA = createHmac('sha256', 'afnon.compare').update(bufferA).digest();
  const digestB = createHmac('sha256', 'afnon.compare').update(bufferB).digest();
  return timingSafeEqual(digestA, digestB);
}

export function verifyPassword(candidate: string): boolean {
  if (!adminPasswordConfigured) return false;
  return safeEqual(candidate, getPassword());
}

export function createSession(): void {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}.${randomBytes(12).toString('base64url')}`;
  const token = `${payload}.${sign(payload)}`;

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function destroySession(): void {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/** True only for a cookie this server signed, that has not expired. */
export function isAuthenticated(): boolean {
  if (!adminPasswordConfigured) return false;

  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;

  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload.split('.')[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
