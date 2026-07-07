import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { CompanySidebar } from '@/components/company/sidebar.component';
import { Topbar } from '@/components/layout/topbar.component';
import { getSessionUser } from '@/server/session';

export const Route = createFileRoute('/company/$companyId')({
  beforeLoad: async ({ params }) => {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      throw redirect({
        to: '/auth/signin',
        search: {
          companyId: params.companyId,
        },
      });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    const hasCompanyAccess =
      ('companyId' in sessionUser &&
        sessionUser.companyId === params.companyId) ||
      (sessionUser.accessLevel === 'admin' &&
        sessionUser.permissions?.includes('manage-clients')) ||
      sessionUser.accessLevel === 'owner';

    if (!hasCompanyAccess) {
      throw redirect({ to: '/unauthorized' });
    }

    return {
      sessionUser,
    };
  },
  component: CompanyLayout,
});

function CompanyLayout() {
  const { companyId } = Route.useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CompanySidebar
        companyId={companyId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
