import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import {
  MdOutlineMenuBook,
  MdOutlinePlaylistAddCheck,
  MdOutlineFolder,
  MdOutlineInsights,
} from 'react-icons/md';

import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-library'],
};

type LibraryTab =
  | { icon: React.ElementType; label: string; to: '/library'; soon?: false }
  | { icon: React.ElementType; label: string; soon: true };

const TABS: LibraryTab[] = [
  { icon: MdOutlineMenuBook, label: 'Guias de Conteúdo', to: '/library' },
  { icon: MdOutlinePlaylistAddCheck, label: 'Playbooks', soon: true },
  { icon: MdOutlineFolder, label: 'Materiais', soon: true },
  { icon: MdOutlineInsights, label: 'Estratégias', soon: true },
];

export const Route = createFileRoute('/_admin/library')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: LibraryLayout,
});

function LibraryLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-text">
            Biblioteca
          </h1>
          <p className="text-[12px] text-text-sub">
            Conhecimento, playbooks, materiais e estratégias da empresa.
          </p>
        </div>
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
