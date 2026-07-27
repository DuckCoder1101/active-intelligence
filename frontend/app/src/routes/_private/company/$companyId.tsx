import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { CompanySidebar } from '@/components/company/sidebar.component';
import { Topbar } from '@/components/layout/topbar.component';

export const Route = createFileRoute('/_private/company/$companyId')({
  beforeLoad: ({ context, params }) => {
    const { sessionUser } = context;

    const hasCompanyAccess =
      ('companyId' in sessionUser &&
        sessionUser.companyId === params.companyId) ||
      (sessionUser.accessLevel === 'admin' &&
        sessionUser.permissions?.includes('manage-clients')) ||
      sessionUser.accessLevel === 'owner';

    if (!hasCompanyAccess) {
      throw redirect({ to: '/unauthorized' });
    }
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
