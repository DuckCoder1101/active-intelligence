import {
  MdOutlineDashboard,
  MdOutlineBusiness,
  MdOutlineAccountTree,
  MdOutlinePushPin,
  MdOutlineAccountBalance,
  MdOutlineBarChart,
  MdOutlineHub,
  MdOutlineSettings,
} from 'react-icons/md';

import type { NavSection } from '@/types/navbar-item.type';

export const NAVBAR_ITEMS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: MdOutlineDashboard },
      { to: '/app/clients', label: 'Clientes', icon: MdOutlineBusiness },
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
        to: '/app/operacional',
        label: 'Operacional',
        icon: MdOutlinePushPin,
        badge: 2,
      },
      {
        to: '/app/financeiro',
        label: 'Financeiro',
        icon: MdOutlineAccountBalance,
      },
      { to: '/app/gestao', label: 'Gestão Comercial', icon: MdOutlineBarChart },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/app/integracoes', label: 'Integrações', icon: MdOutlineHub },
      {
        to: '/app/configuracoes',
        label: 'Configurações',
        icon: MdOutlineSettings,
      },
    ],
  },
];
