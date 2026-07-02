import {
  MdOutlineDashboard,
  MdOutlineBusiness,
  MdOutlineAccountTree,
  MdOutlinePushPin,
  MdOutlineAccountBalance,
  MdOutlineBarChart,
  MdOutlineSettings,
  MdOutlineViewKanban,
  MdOutlineAdminPanelSettings,
} from 'react-icons/md';

import type { NavSection } from '@/types/navbar-item.type';

export const SIDEBAR_ITEMS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: MdOutlineDashboard,
      },
      {
        to: '/clients',
        label: 'Clientes',
        icon: MdOutlineBusiness,
      },
      {
        to: '/projects',
        label: 'Projetos',
        icon: MdOutlineViewKanban,
      },
    ],
  },
  {
    label: 'Módulos',
    items: [
      {
        to: '/app/pipeline',
        label: 'Pipeline CRM',
        icon: MdOutlineAccountTree,
      },
      {
        to: '/app/operational',
        label: 'Operacional',
        icon: MdOutlinePushPin,
        badge: 2,
      },
      {
        to: '/app/finances',
        label: 'Financeiro',
        icon: MdOutlineAccountBalance,
      },
      {
        to: '/app/gestao',
        label: 'Gestão Comercial',
        icon: MdOutlineBarChart,
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        to: '/app/team',
        label: 'Administradores',
        icon: MdOutlineAdminPanelSettings,
      },
      {
        to: '/app/settings',
        label: 'Configurações do painel',
        icon: MdOutlineSettings,
      },
    ],
  },
];
