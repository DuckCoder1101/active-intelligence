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
        to: '/app/admin/dashboard',
        label: 'Dashboard',
        icon: MdOutlineDashboard,
      },
      {
        to: '/app/admin/clients',
        label: 'Clientes',
        icon: MdOutlineBusiness,
      },
      {
        to: '/app/admin/projects',
        label: 'Projetos',
        icon: MdOutlineViewKanban,
      },
    ],
  },
  {
    label: 'Módulos',
    items: [
      {
        to: '/app/admin/pipeline',
        label: 'Pipeline CRM',
        icon: MdOutlineAccountTree,
      },
      {
        to: '/app/admin/operational',
        label: 'Operacional',
        icon: MdOutlinePushPin,
        badge: 2,
      },
      {
        to: '/app/admin/finances',
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
        to: '/app/admin/team',
        label: 'Administradores',
        icon: MdOutlineAdminPanelSettings,
      },
      {
        to: '/app/admin/settings',
        label: 'Configurações do painel',
        icon: MdOutlineSettings,
      },
    ],
  },
];
