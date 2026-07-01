import { Link } from '@tanstack/react-router';
import React from 'react';
import {
  MdOutlineDashboard,
  MdOutlineCalendarMonth,
  MdOutlineCampaign,
  MdOutlineGroup,
  MdClose,
} from 'react-icons/md';

interface NavItem {
  to:
    | '/company/$companyId'
    | '/company/$companyId/schedule'
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
    to: '/company/$companyId/ad-accounts',
    label: 'Contas de anúncios',
    icon: MdOutlineCampaign,
    exact: false,
  },
  {
    to: '/company/$companyId/team',
    label: 'Equipe',
    icon: MdOutlineGroup,
    exact: false,
  },
];

interface UserSidebarProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSidebar({ companyId, isOpen, onClose }: UserSidebarProps) {
  return (
    <aside
      className={[
        'flex w-60 shrink-0 flex-col bg-sidebar',
        'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
        'lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-end px-3 pt-3 lg:hidden">
        <button
          type="button"
          onClick={onClose}
          className="btn-icon text-slate-500 hover:text-slate-300"
        >
          <MdClose size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 justify-center">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            params={{ companyId }}
            activeOptions={{ exact: item.exact }}
            onClick={onClose}
            className="flex cursor-pointer items-center gap-2.5 border-l-[3px] border-transparent px-5 py-2.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-sidebar-hover hover:text-slate-300"
            activeProps={{
              className:
                'flex cursor-pointer items-center gap-2.5 border-l-[3px] border-orange bg-sidebar-hover px-5 py-2.5 text-[12px] font-medium text-slate-100 transition-colors',
            }}
          >
            <item.icon size={17} style={{ flexShrink: 0 }} />
            <span className="flex-1">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
