import { auth } from '@utils/firebase';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/')({
  beforeLoad: async () => {
    await auth.authStateReady();

    if (!auth.currentUser) {
      throw redirect({ to: '/auth/signin' });
    }
  },
  component: () => <Outlet />,
});
