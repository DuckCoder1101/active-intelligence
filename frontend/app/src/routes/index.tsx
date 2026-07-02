import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSessionUser } from '@/server/session';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    const accessLevel = (sessionUser as { accessLevel?: string } | null)
      ?.accessLevel;

    if (accessLevel === 'user') {
      throw redirect({ to: '/user/mycompany' });
    }

    throw redirect({ to: '/auth/signin' });
  },
});
