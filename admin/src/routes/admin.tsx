import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Topbar } from '@/components/projects/topbar.component';
import { getSessionUser } from '@/server/session';
import { isAdmin } from '@/utils/isAdmin.util';

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      throw redirect({ to: '/auth/signin' });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    if (!isAdmin(sessionUser)) {
      throw redirect({ to: '/unauthorized' });
    }

    return {
      sessionUser,
    };
  },
  component: AdminComponent,
});

function AdminComponent() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Topbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
