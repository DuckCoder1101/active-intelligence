import type { Crumb } from '@/types/crumb.type';

export const BROADCRUMB_ROUTE_MAP: {
  test: (p: string) => boolean;
  crumbs: Crumb[];
}[] = [
  {
    test: (p) => p.startsWith('/admin/dashboard'),
    crumbs: [{ label: 'Dashboard', to: '/admin/dashboard' }],
  },
  {
    test: (p) => p.startsWith('/admin/clients'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Clientes' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/projects'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Projetos' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/team'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Administradores' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/settings'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Configurações' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/pipeline'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Pipeline CRM' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/operational'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Operacional' },
    ],
  },
  {
    test: (p) => p.startsWith('/admin/finances'),
    crumbs: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Financeiro' },
    ],
  },
  {
    test: (p) =>
      /^\/app\/company\/[^/]+\/$/.test(p) || /^\/app\/company\/[^/]+$/.test(p),
    crumbs: [{ label: 'Dashboard' }],
  },
  {
    test: (p) => /^\/app\/company\/[^/]+\/schedule/.test(p),
    crumbs: [{ label: 'Cronograma' }],
  },
  {
    test: (p) => /^\/app\/company\/[^/]+\/ad-accounts/.test(p),
    crumbs: [{ label: 'Contas de anúncios' }],
  },
  {
    test: (p) => /^\/app\/company\/[^/]+\/team/.test(p),
    crumbs: [{ label: 'Equipe' }],
  },
  {
    test: (p) => p.startsWith('/user/profile'),
    crumbs: [{ label: 'Perfil' }],
  },
];
