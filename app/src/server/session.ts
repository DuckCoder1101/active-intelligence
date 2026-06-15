import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';

import { adminAuth } from '@/server/firebase-admin.server';
import type { FirebaseTokenClaims } from '@t/session.type';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;
const isDev = import.meta.env['VITE_IS_DEV'] === 'true';

export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FirebaseTokenClaims | null> => {
    const cookie = getCookie(SESSION_COOKIE);
    if (!cookie) return null;

    try {
      const decoded = await adminAuth.verifySessionCookie(cookie, true);
      return {
        uid: decoded.uid,
        email: decoded.email!,
        accessLevel: (decoded['accessLevel'] ?? 'client') as FirebaseTokenClaims['accessLevel'],
      };
    } catch {
      return null;
    }
  },
);

export const createSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as { idToken: string })
  .handler(async ({ data }) => {
    const sessionCookie = await adminAuth.createSessionCookie(data.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    setCookie(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });

export const deleteSession = createServerFn({ method: 'POST' }).handler(async () => {
  const cookie = getCookie(SESSION_COOKIE);

  if (cookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(cookie);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    } catch {}
  }

  deleteCookie(SESSION_COOKIE, { path: '/' });
});
