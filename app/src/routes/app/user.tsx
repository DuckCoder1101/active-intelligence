import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Topbar } from '@/components/layout/topbar.component';

export const Route = createFileRoute('/app/user')({
  component: UserLayout,
});

function UserLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
