import { Topbar } from '@/components/layout/topbar.component';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = { minAccessLevel: 'admin' };

export const Route = createFileRoute('/app/admin')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/app/unauthorized' });
    }
  },
  component: AdminComponent,
});

function AdminComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
