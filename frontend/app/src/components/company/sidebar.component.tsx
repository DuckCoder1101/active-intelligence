import { Link } from '@tanstack/react-router';
import React from 'react';
import {
  MdOutlineDashboard,
  MdOutlineCalendarMonth,
  MdOutlineAccountTree,
  MdOutlineMenuBook,
  MdOutlineApartment,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineSupportAgent,
} from 'react-icons/md';

const SUPPORT_PHONE = '5519997834256';
const SUPPORT_URL = `https://wa.me/${SUPPORT_PHONE}`;

interface NavItem {
  to:
    | '/company/$companyId'
    | '/company/$companyId/schedule'
    | '/company/$companyId/crm'
    | '/company/$companyId/real-estate'
    | '/company/$companyId/library'
    | '/company/$companyId/ad-accounts'
    | '/company/$companyId/team';
  label: string;
  icon: React.ElementType;
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/company/$companyId',
    label: 'Dashboard',
    icon: MdOutlineDashboard,
    exact: true,
  },
  {
    to: '/company/$companyId/schedule',
    label: 'Cronograma',
    icon: MdOutlineCalendarMonth,
    exact: false,
  },
  {
    to: '/company/$companyId/crm',
    label: 'CRM',
    icon: MdOutlineAccountTree,
    exact: false,
  },
  {
    to: '/company/$companyId/real-estate',
    label: 'Imóveis',
    icon: MdOutlineApartment,
    exact: false,
  },
  {
    to: '/company/$companyId/library',
    label: 'Conteúdos',
    icon: MdOutlineMenuBook,
    exact: false,
  },
  // {
  //   to: '/company/$companyId/ad-accounts',
  //   label: 'Contas de anúncios',
  //   icon: MdOutlineCampaign,
  //   exact: false,
  // },
  // {
  //   to: '/company/$companyId/team',
  //   label: 'Equipe',
  //   icon: MdOutlineGroup,
  //   exact: false,
  // },
];

interface CompanySidebarProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function CompanySidebar({
  companyId,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: CompanySidebarProps) {
  return (
    <aside
      className={[
        'flex shrink-0 flex-col overflow-hidden bg-sidebar transition-[width,transform] duration-300 ease-in-out',
        collapsed ? 'w-17.5' : 'w-60',
        'fixed inset-y-0 left-0 z-40',
        'lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Collapse toggle */}
      <div className={`flex items-center px-3 pt-3 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="btn-icon text-white/50 hover:text-white/80"
        >
          {collapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 justify-center mt-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            params={{ companyId }}
            activeOptions={{ exact: item.exact }}
            onClick={onClose}
            title={collapsed ? item.label : undefined}
            className={[
              'flex cursor-pointer items-center gap-2.5 border-l-[3px] border-transparent py-2.5 text-[12px] font-medium text-white transition-all duration-300 ease-in-out hover:bg-sidebar-hover',
              collapsed ? 'justify-center px-0' : 'px-5',
            ].join(' ')}
            activeProps={{
              className: [
                'flex cursor-pointer items-center gap-2.5 border-l-[3px] border-orange bg-orange/15 py-2.5 text-[12px] font-medium text-white transition-all duration-300 ease-in-out',
                collapsed ? 'justify-center px-0' : 'px-5',
              ].join(' '),
            }}
          >
            <item.icon size={17} style={{ flexShrink: 0 }} />
            <span
              className={[
                'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-40 flex-1 opacity-100',
              ].join(' ')}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer: support */}
      <div className="flex flex-col gap-1 border-t border-white/10 py-2">
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Falar com o suporte"
          className={[
            'flex cursor-pointer items-center gap-2.5 py-2.5 text-[12px] font-medium text-white transition-all duration-300 ease-in-out hover:bg-sidebar-hover',
            collapsed ? 'justify-center px-0' : 'px-5',
          ].join(' ')}
        >
          <MdOutlineSupportAgent size={17} style={{ flexShrink: 0 }} />
          <span
            className={[
              'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-40 flex-1 opacity-100',
            ].join(' ')}
          >
            Suporte
          </span>
        </a>
      </div>
    </aside>
  );
}
