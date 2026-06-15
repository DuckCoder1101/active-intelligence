import { Sidebar } from '@/components/layout/sidebar.component';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/organization')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
