import { Link, useRouterState } from '@tanstack/react-router';
import { MdChevronRight } from 'react-icons/md';

type Crumb = { label: string; to?: string };

const ROUTE_MAP: { test: (p: string) => boolean; crumbs: Crumb[] }[] = [
  {
    test: (p) => p.startsWith('/app/admin/dashboard'),
    crumbs: [{ label: 'Dashboard', to: '/app/admin/dashboard' }],
  },
  {
    test: (p) => p.startsWith('/app/admin/companies'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Clientes' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/admin/clients'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Clientes' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/admin/settings'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Configurações' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/admin/pipeline'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Pipeline CRM' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/admin/operational'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Operacional' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/admin/finances'),
    crumbs: [
      { label: 'Dashboard', to: '/app/admin/dashboard' },
      { label: 'Financeiro' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/company/'),
    crumbs: [
      { label: 'Clientes', to: '/app/admin/companies' },
      { label: 'Empresa' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/user/profile'),
    crumbs: [{ label: 'Perfil' }],
  },
  {
    test: (p) => p.startsWith('/app/gestao'),
    crumbs: [{ label: 'Gestão Comercial' }],
  },
];

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const match = ROUTE_MAP.find((r) => r.test(pathname));
  if (!match) return null;

  const { crumbs } = match;

  return (
    <nav className="flex items-center gap-1 text-[12px] text-text-muted">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1">
          {i > 0 && (
            <MdChevronRight size={14} className="shrink-0 text-text-muted/50" />
          )}
          {crumb.to ? (
            <Link
              to={crumb.to}
              className="text-text-sub transition-colors hover:text-text"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={
                i === crumbs.length - 1
                  ? 'font-semibold text-text'
                  : 'text-text-sub'
              }
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
