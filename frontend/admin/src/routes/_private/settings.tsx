import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { SettingsSidebar } from '@/components/settings/settings-sidebar.component';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-settings'],
};

export const Route = createFileRoute('/_private/settings')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <SettingsSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
