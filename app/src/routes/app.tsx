import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSessionUser } from '@/server/session';

export const Route = createFileRoute('/app')({
  component: () => <Outlet />,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) throw redirect({ to: '/auth/signin' });
    return { sessionUser };
  },
});
