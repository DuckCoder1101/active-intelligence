import { createServerFn } from '@tanstack/react-start';
import {
  getCookie,
  setCookie,
  deleteCookie,
} from '@tanstack/react-start/server';

import { adminAuth } from '@/server/firebase-admin.server';
import type { CustomClaims } from '@/types/custom-claims.type';
import type { AdminPermission } from '@/types/permissions.type';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

const isDev = process.env['NODE_ENV'] !== 'production';

export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CustomClaims | null> => {
    const cookie = getCookie(SESSION_COOKIE);
    if (!cookie) {
      return null;
    }

    try {
      // checkRevoked só em produção: em dev ele faz uma ida ao Auth emulator
      // a cada navegação, e qualquer piscada do emulator viraria "deslogado".
      const decoded = await adminAuth.verifySessionCookie(cookie, !isDev);
      const accessLevel = decoded['accessLevel'] as CustomClaims['accessLevel'];
      const complete = decoded['complete'] as boolean | undefined;

      if (accessLevel === 'user') {
        return {
          accessLevel,
          complete,
          companyId: decoded['companyId'] as string | undefined,
        };
      }
      return {
        accessLevel,
        complete,
        permissions: (decoded['permissions'] ?? []) as AdminPermission[],
      };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (typeof code === 'string' && code.startsWith('auth/')) {
        // Cookie inválido/expirado/revogado — não logado mesmo.
        return null;
      }
      // Falha de infra (rede, emulator fora do ar): retornar null aqui
      // deslogaria um usuário com sessão válida e inicia o ping-pong
      // signin ⇄ guard. Melhor falhar a navegação e manter a sessão.
      console.error('[session] verifySessionCookie failed (non-auth)', err);
      throw err;
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

export const deleteSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => (data ?? {}) as { revoke?: boolean })
  .handler(async ({ data }) => {
    // Revogar refresh tokens derruba a conta em TODOS os dispositivos — se
    // outra pessoa/aba estiver na mesma conta, a sessão dela morre no meio
    // do que estiver fazendo (as callables passam a sair sem Authorization
    // e falham como "unauthenticated"). Por isso é opt-in: o caminho
    // automático (logout comum, SDK sem usuário ao carregar) só apaga o
    // cookie deste dispositivo.
    if (data.revoke) {
      const cookie = getCookie(SESSION_COOKIE);
      if (cookie) {
        const decoded = await adminAuth.verifySessionCookie(cookie);
        await adminAuth.revokeRefreshTokens(decoded.sub);
      }
    }

    deleteCookie(SESSION_COOKIE, { path: '/' });
  });
