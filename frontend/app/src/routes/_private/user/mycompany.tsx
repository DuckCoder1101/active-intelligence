import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/user/mycompany')({
  beforeLoad: ({ context }) => {
    const { sessionUser } = context;

    const companyId =
      sessionUser.accessLevel === 'user' ? sessionUser.companyId : undefined;

    if (!companyId) {
      throw redirect({ to: '/user/profile' });
    }

    throw redirect({
      to: '/company/$companyId',
      params: { companyId },
    });
  },
});
