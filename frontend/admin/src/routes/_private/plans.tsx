import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdOutlineInventory2,
  MdOutlineShoppingBag,
  MdOutlinePlaylistAddCheck,
  MdMenu,
} from 'react-icons/md';

import type { SidebarNavItem } from '@/components/layout/sidebar.component';
import { Sidebar } from '@/components/layout/sidebar.component';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-plans'],
};

const TABS: SidebarNavItem[] = [
  { key: 'plans', icon: MdOutlineInventory2, label: 'Planos', to: '/plans', exact: true },
  { key: 'products', icon: MdOutlineShoppingBag, label: 'Produtos', soon: true },
  { key: 'playbooks', icon: MdOutlinePlaylistAddCheck, label: 'Playbooks', soon: true },
];

const SIDEBAR_COLLAPSED_KEY = 'plans-sidebar-collapsed';

export const Route = createFileRoute('/_private/plans')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: PlansLayout,
});

function PlansLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        items={TABS}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="lg:absolute lg:inset-y-0 lg:left-0 lg:z-10"
      />

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 ease-in-out ${collapsed ? 'lg:pl-17.5' : 'lg:pl-56'}`}
      >
        <div className="flex shrink-0 flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-text-muted transition-colors hover:text-text lg:hidden"
            >
              <MdMenu size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-text">
                Planos
              </h1>
              <p className="text-[12px] text-text-sub">
                Produtos, planos e playbooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
