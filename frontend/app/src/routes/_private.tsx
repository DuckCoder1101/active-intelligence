import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSessionUser } from '@/server/session';
import { auth } from '@/utils/firebase.util';

const COMPANY_PATH_RE = /^\/company\/([^/]+)/;

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context, location }) => {
    // O cookie de sessão (servidor) pode já ser válido antes do SDK do
    // Firebase no cliente terminar de restaurar o usuário (ex: reload de
    // página inteira após o login). Sem isso, o loader das rotas filhas
    // dispara chamadas autenticadas antes do auth.currentUser existir e
    // elas saem sem token -> functions/unauthenticated.
    await auth.authStateReady();

    const sessionUser = context.sessionUser ?? (await getSessionUser());

    if (!sessionUser) {
      const companyMatch = COMPANY_PATH_RE.exec(location.pathname);
      throw redirect({
        to: '/auth/signin',
        search: companyMatch
          ? {
              companyId: companyMatch[1],
            }
          : undefined,
      });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    return {
      sessionUser,
    };
  },
  component: Outlet,
});
