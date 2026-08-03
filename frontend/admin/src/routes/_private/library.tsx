import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdOutlineMenuBook,
  MdOutlinePlaylistAddCheck,
  MdOutlineFolder,
  MdOutlineInsights,
  MdMenu,
} from 'react-icons/md';

import type { SidebarNavItem } from '@/components/layout/sidebar.component';
import { Sidebar } from '@/components/layout/sidebar.component';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-library'],
};

const TABS: SidebarNavItem[] = [
  { key: 'guides', icon: MdOutlineMenuBook, label: 'Guias de Conteúdo', to: '/library', exact: true },
  { key: 'playbooks', icon: MdOutlinePlaylistAddCheck, label: 'Playbooks', soon: true },
  { key: 'materials', icon: MdOutlineFolder, label: 'Materiais', soon: true },
  { key: 'strategies', icon: MdOutlineInsights, label: 'Estratégias', soon: true },
];

const SIDEBAR_COLLAPSED_KEY = 'library-sidebar-collapsed';

export const Route = createFileRoute('/_private/library')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: LibraryLayout,
});

function LibraryLayout() {
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
                Biblioteca
              </h1>
              <p className="text-[12px] text-text-sub">
                Conhecimento, playbooks, materiais e estratégias da empresa.
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
