import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSessionUser } from '@/server/session';
import { auth } from '@/utils/firebase.util';

const COMPANY_PATH_RE = /^\/company\/([^/]+)/;

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context, location }) => {
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
