import type { Crumb } from '@/types/crumb.type';

export const BROADCRUMB_ROUTE_MAP: {
  test: (p: string) => boolean;
  crumbs: Crumb[];
}[] = [
  {
    test: (p) => p.startsWith('/app/admin/dashboard'),
    crumbs: [{ label: 'Dashboard', to: '/app/admin/dashboard' }],
  },
  {
    test: (p) => p.startsWith('/app/admin/clients'),
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
      { label: 'Painel', to: '/app/admin/clients' },
      { label: 'Ficha do cliente' },
    ],
  },
  {
    test: (p) => p.startsWith('/app/user/profile'),
    crumbs: [{ label: 'Perfil' }],
  },
];
