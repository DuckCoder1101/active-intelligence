import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import {
  MdOutlineDashboard,
  MdOutlineViewKanban,
  MdOutlineCampaign,
  MdOutlineSentimentSatisfied,
  MdOutlineHistory,
  MdOutlinePeople,
} from 'react-icons/md';

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

type WorkspaceTab =
  | {
      icon: React.ElementType;
      label: string;
      to:
        | '/workspace'
        | '/workspace/schedule'
        | '/workspace/history'
        | '/workspace/clients';
      soon?: false;
    }
  | { icon: React.ElementType; label: string; soon: true };

const TABS: WorkspaceTab[] = [
  { icon: MdOutlineDashboard, label: 'Visão Geral', to: '/workspace' },
  { icon: MdOutlineViewKanban, label: 'Cronograma', to: '/workspace/schedule' },
  { icon: MdOutlineCampaign, label: 'Campanhas', soon: true },
  { icon: MdOutlineSentimentSatisfied, label: 'CS & Satisfação', soon: true },
  { icon: MdOutlineHistory, label: 'Histórico', to: '/workspace/history' },
  { icon: MdOutlinePeople, label: 'Clientes', to: '/workspace/clients' },
];

export const Route = createFileRoute('/_admin/workspace')({
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
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-text">
            Workspace
          </h1>
          <p className="text-[12px] text-text-sub">
            Operação por cliente, tudo em um só lugar.
          </p>
        </div>
        <ClientFilter />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
        {TABS.map((tab) =>
          tab.soon ? (
            <div
              key={tab.label}
              className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium text-text-muted opacity-60"
            >
              <tab.icon size={15} />
              {tab.label}
              <span className="rounded-full bg-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-orange">
                em breve
              </span>
            </div>
          ) : (
            <Link
              key={tab.label}
              to={tab.to}
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-[13px] font-medium text-text-sub transition-colors hover:text-text [&.active]:border-orange [&.active]:text-text"
              activeOptions={{ exact: true }}
              activeProps={{ className: 'active' }}
            >
              <tab.icon size={15} />
              {tab.label}
            </Link>
          ),
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
