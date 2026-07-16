import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdOutlineBarChart,
  MdOutlineDashboard,
  MdOutlineReceiptLong,
} from 'react-icons/md';

import { FinanceTransactionsTab } from '@components/finances/transactions-tab.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { Tabs } from '@/components/ui/tabs.component';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  financeAccountsQueryOptions,
  financeCategoriesQueryOptions,
  transactionsQueryOptions,
} from '@/queries/finance.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-finance'],
};

export const Route = createFileRoute('/_admin/finances')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(transactionsQueryOptions()),
      context.queryClient.ensureQueryData(financeCategoriesQueryOptions()),
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

function FinancePage() {
  const [activeTab, setActiveTab] = useState('lancamentos');

  return (
    <AdminPageContainer>
      <h1 className="text-xl font-black tracking-tight text-text sm:text-2xl">
        Financeiro
      </h1>

      <div className="mt-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
      </div>
    </AdminPageContainer>
  );
}
