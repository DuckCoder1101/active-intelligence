import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Topbar } from '@/components/admin/topbar.component';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import { getSessionUser } from '@/server/session';

import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = { minAccessLevel: 'admin' };

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      throw redirect({ to: '/auth/signin' });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    if (!checkRouteAccess(sessionUser, ACCESS)) {
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
