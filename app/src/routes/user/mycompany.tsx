import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSessionUser } from '@/server/session';

export const Route = createFileRoute('/user/mycompany')({
  beforeLoad: async ({ context }) => {
    const s = context.sessionUser ?? (await getSessionUser());
    if (!s) throw redirect({ to: '/auth/signin' });

    const companyId = s.accessLevel === 'user' ? s.companyId : undefined;
    if (!companyId) throw redirect({ to: '/unauthorized' });

    throw redirect({ to: '/company/$companyId', params: { companyId } });
  },
});
