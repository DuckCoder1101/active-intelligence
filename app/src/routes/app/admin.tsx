import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Sidebar } from '@/components/layout/sidebar.component';

export const Route = createFileRoute('/app/admin')({
  beforeLoad: ({ context }) => {
    if (context.sessionUser!.accessLevel !== 'admin') {
      throw redirect({ to: '/app/user/profile' });
    }
  },
  component: AdminPanelLayout,
});

function AdminPanelLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
