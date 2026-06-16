import { Topbar } from '@/components/layout/topbar.component';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/admin')({
  beforeLoad: ({ context }) => {
    if (context.sessionUser.accessLevel !== 'admin') {
      throw redirect({ to: '/app/user/profile' });
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
