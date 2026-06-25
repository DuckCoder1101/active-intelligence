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
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Topbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminPageContainer({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl overflow-y-auto px-4 py-8 sm:px-6 sm:py-12">
      {children}
    </div>
  );
}
