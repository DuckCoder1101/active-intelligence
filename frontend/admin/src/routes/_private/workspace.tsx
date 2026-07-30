import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
  useSearch,
} from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdOutlineDashboard,
  MdOutlineViewKanban,
  MdOutlineCampaign,
  MdOutlineSentimentSatisfied,
  MdOutlineHistory,
  MdOutlinePeople,
  MdDashboard,
  MdCalendarMonth,
} from 'react-icons/md';

import type { SidebarNavItem } from '@/components/layout/sidebar.component';
import { Sidebar } from '@/components/layout/sidebar.component';
import { ClientFilter } from '@/components/workspace/client-filter.component';
import { companiesQueryOptions } from '@/queries/company.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-projects'],
};

interface WorkspaceSearchParams {
  clients?: string;
}

const TABS: SidebarNavItem[] = [
  { key: 'overview', icon: MdOutlineDashboard, label: 'Visão Geral', to: '/workspace', exact: true },
  { key: 'schedule', icon: MdOutlineViewKanban, label: 'Cronograma', to: '/workspace/schedule', exact: true },
  { key: 'campaigns', icon: MdOutlineCampaign, label: 'Campanhas', soon: true },
  { key: 'cs', icon: MdOutlineSentimentSatisfied, label: 'CS & Satisfação', soon: true },
  { key: 'history', icon: MdOutlineHistory, label: 'Histórico', to: '/workspace/history', exact: true },
  { key: 'clients', icon: MdOutlinePeople, label: 'Clientes', to: '/workspace/clients', exact: true },
];

const SIDEBAR_COLLAPSED_KEY = 'workspace-sidebar-collapsed';

const SCHEDULE_VIEWS = [
  { id: 'kanban' as const, label: 'Kanban', icon: MdDashboard },
  { id: 'calendario' as const, label: 'Calendário', icon: MdCalendarMonth },
];

export const Route = createFileRoute('/_private/workspace')({
  ssr: false,
  validateSearch: (search): WorkspaceSearchParams => ({
    clients:
      typeof search.clients === 'string' && search.clients.length > 0
        ? search.clients
        : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(companiesQueryOptions()),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSchedule = pathname === '/workspace/schedule';
  const search = useSearch({ strict: false }) as { view?: 'kanban' | 'calendario' };
  const scheduleView = search.view ?? 'kanban';

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {/* Sobe até encostar no topbar, ocupa a coluna esquerda inteira — a
          faixa de título abaixo reserva o respiro com padding-left. */}
      <Sidebar
        items={TABS}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        className="absolute inset-y-0 left-0 z-10"
      />

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 ease-in-out ${collapsed ? 'pl-17.5' : 'pl-56'}`}
      >
        <div className="flex shrink-0 flex-col items-center gap-3 border-b border-border px-4 py-4 sm:flex-row sm:gap-6 sm:px-6">
          <div className="text-center sm:flex-1 sm:text-left">
            <h1 className="text-xl font-black tracking-tight text-text">
              Workspace
            </h1>
            <p className="text-[12px] text-text-sub">
              Operação por cliente, tudo em um só lugar.
            </p>
          </div>
          <div className="sm:flex sm:flex-1 sm:justify-center">
            <ClientFilter />
          </div>
          <div className="flex sm:flex-1 sm:justify-end">
            {isSchedule && (
              <div className="flex items-center gap-2">
                {SCHEDULE_VIEWS.map(({ id, label, icon: Icon }) => (
                  <Link
                    key={id}
                    to="/workspace/schedule"
                    search={{ view: id }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                      scheduleView === id
                        ? 'bg-orange/10 text-orange'
                        : 'text-text-sub hover:bg-bg hover:text-text'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
