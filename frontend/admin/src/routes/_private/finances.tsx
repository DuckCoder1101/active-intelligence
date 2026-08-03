import { FinanceTransactionsTab } from '@components/finances/transactions-tab.component';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdMenu,
  MdOutlineBarChart,
  MdOutlineDashboard,
  MdOutlineReceiptLong,
} from 'react-icons/md';

import type { SidebarNavItem } from '@/components/layout/sidebar.component';
import { Sidebar } from '@/components/layout/sidebar.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  financeAccountsQueryOptions,
  financeSubcategoriesQueryOptions,
  transactionsQueryOptions,
} from '@/queries/finance.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-finance'],
};

export const Route = createFileRoute('/_private/finances')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(transactionsQueryOptions()),
      context.queryClient.ensureQueryData(financeSubcategoriesQueryOptions()),
      context.queryClient.ensureQueryData(financeAccountsQueryOptions()),
      context.queryClient.ensureQueryData(companiesQueryOptions()),
    ]),
  component: FinancePage,
});

const TABS = [
  { id: 'visao-geral', label: 'Visão geral', icon: MdOutlineDashboard },
  { id: 'lancamentos', label: 'Lançamentos', icon: MdOutlineReceiptLong },
  { id: 'dre', label: 'DRE', icon: MdOutlineBarChart },
];

const SIDEBAR_COLLAPSED_KEY = 'finances-sidebar-collapsed';

function FinancePage() {
  const [activeTab, setActiveTab] = useState('lancamentos');
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const sidebarItems: SidebarNavItem[] = TABS.map((tab) => ({
    key: tab.id,
    icon: tab.icon,
    label: tab.label,
    onClick: () => setActiveTab(tab.id),
    active: activeTab === tab.id,
  }));

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        items={sidebarItems}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="lg:absolute lg:inset-y-0 lg:left-0 lg:z-10"
      />

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 ease-in-out ${collapsed ? 'lg:pl-17.5' : 'lg:pl-56'}`}
      >
        <AdminPageContainer>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-text-muted transition-colors hover:text-text lg:hidden"
            >
              <MdMenu size={20} />
            </button>
            <h1 className="text-xl font-black tracking-tight text-text sm:text-2xl">
              Financeiro
            </h1>
          </div>

          <div className="mt-6">
            {activeTab === 'visao-geral' && (
              <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
                <p className="text-[13px]">Em breve.</p>
              </div>
            )}
            {activeTab === 'lancamentos' && <FinanceTransactionsTab />}
            {activeTab === 'dre' && (
              <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
                <p className="text-[13px]">Em breve.</p>
              </div>
            )}
          </div>
        </AdminPageContainer>
      </div>
    </div>
  );
}
