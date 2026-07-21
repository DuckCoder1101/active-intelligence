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
    test: (p) => p.startsWith('/workspace'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Workspace' }],
  },
  {
    test: (p) => p.startsWith('/team'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Administradores' }],
  },
  {
    test: (p) => p.startsWith('/finances'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Financeiro' }],
  },
  {
    test: (p) => p.startsWith('/library'),
    crumbs: [{ label: 'Dashboard', to: '/' }, { label: 'Biblioteca' }],
  },
];
