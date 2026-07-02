import type { Crumb } from '@/types/crumb.type';

export const BROADCRUMB_ROUTE_MAP: {
  test: (p: string) => boolean;
  crumbs: Crumb[];
}[] = [
  {
    test: (p) => p === '/',
    crumbs: [{ label: 'Dashboard', to: '/' }],
  },
  {
    test: (p) => p.startsWith('/companies'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Clientes' }],
  },
  {
    test: (p) => p.startsWith('/projects'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Projetos' }],
  },
  {
    test: (p) => p.startsWith('/team'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Administradores' }],
  },
  {
    test: (p) => p.startsWith('/settings'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Configurações' }],
  },
  {
    test: (p) => p.startsWith('/pipeline'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Pipeline CRM' }],
  },
  {
    test: (p) => p.startsWith('/operational'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Operacional' }],
  },
  {
    test: (p) => p.startsWith('/finances'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Financeiro' }],
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
