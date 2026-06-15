import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/admin')({
  beforeLoad: ({ context }) => {
    if (context.sessionUser.accessLevel !== 'admin') {
      throw redirect({ to: '/app/user/profile' });
    }
  },
  component: () => <Outlet />,
});
