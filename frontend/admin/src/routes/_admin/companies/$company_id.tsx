import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdArrowBack,
  MdOutlineOpenInNew,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineBadge,
  MdOutlineLocationOn,
  MdOutlinePeopleAlt,
  MdOutlineHistory,
  MdOutlinePayments,
  MdDelete,
} from 'react-icons/md';

import { ClientAuditTab } from '@/components/companies/company/audit-tab.component';
import { ClientFinancialTab } from '@/components/companies/company/financial-tab.component';
import { ClientInfoTab } from '@/components/companies/company/info-tab.component';
import { CompanyMembersTab } from '@/components/companies/company/members-tab.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { Badge } from '@/components/ui/badge.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { Tabs } from '@/components/ui/tabs.component';
import { useAuth } from '@/contexts/auth.context';
import { formatCNPJ } from '@/formatters/formatCnpj';
import { formatPhone } from '@/formatters/formatPhone';
import { adminsQueryOptions } from '@/queries/admin.queries';
import {
  companyDetailQueryOptions,
  useDeleteCompanyMutation,
} from '@/queries/company.queries';
import { contractedServicesQueryOptions } from '@/queries/contracted-service.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-clients'],
};

const FINANCIAL_TAB_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-finance'],
};

export const Route = createFileRoute('/_admin/companies/$company_id')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        companyDetailQueryOptions(params.company_id),
      ),
      context.queryClient.ensureQueryData(adminsQueryOptions()),
      context.queryClient.ensureQueryData(contractedServicesQueryOptions()),
    ]),
  component: ClientDetailPage,
});

const BASE_TABS = [
  { id: 'informacoes', label: 'Informações', icon: MdOutlineLocationOn },
  { id: 'acessos', label: 'Acessos', icon: MdOutlinePeopleAlt },
  { id: 'auditoria', label: 'Auditoria', icon: MdOutlineHistory },
];

const FINANCIAL_TAB = {
  id: 'administrativo',
  label: 'Administrativo',
  icon: MdOutlinePayments,
};

function ClientDetailPage() {
  const { company_id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: company } = useSuspenseQuery(
    companyDetailQueryOptions(company_id),
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('informacoes');
  const deleteCompany = useDeleteCompanyMutation();
  const { claims } = useAuth();

  const canViewFinancial = checkRouteAccess(claims, FINANCIAL_TAB_ACCESS);
  const TABS = canViewFinancial ? [...BASE_TABS, FINANCIAL_TAB] : BASE_TABS;

  const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:3001/';

  const handleDeleteConfirm = () => {
    deleteCompany.mutate(company.companyId, {
      onSuccess: () => navigate({ to: '/companies' }),
    });
  };

  return (
    <AdminPageContainer>
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-sub transition-colors hover:text-text"
      >
        <MdArrowBack size={15} />
        Todos os clientes
      </Link>

      <>
        {/* Header card */}
        <div className="card mt-4 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-black tracking-tight text-text sm:text-2xl">
                  {company.displayName}
                </h1>
                <Badge
                  variant={
                    company.companyStage === 'operacional'
                      ? 'orange'
                      : 'default'
                  }
                >
                  {company.companyStage}
                </Badge>
              </div>

              {company.legalInformation.legalName && (
                <p className="mt-1 text-[13px] text-text-sub">
                  {company.legalInformation.legalName}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-text-sub">
                {company.contact.email && (
                  <span className="flex items-center gap-1.5">
                    <MdOutlineEmail size={14} className="shrink-0" />
                    {company.contact.email}
                  </span>
                )}
                {company.contact.phone && (
                  <span className="flex items-center gap-1.5">
                    <MdOutlinePhone size={14} className="shrink-0" />
                    {formatPhone(company.contact.phone)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MdOutlineBadge size={14} className="shrink-0" />
                  CNPJ{' '}
                  {formatCNPJ(
                    company.legalInformation.documentNumber.replace(/\D/g, ''),
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <MdOutlineLocationOn size={14} className="shrink-0" />
                  {company.location.city} / {company.location.state}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <a
                href={`${APP_URL}/company/${company.companyId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver portal do cliente"
                className="btn-primary"
              >
                <MdOutlineOpenInNew size={15} />
                Ver portal
              </a>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                <MdDelete size={15} />
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'informacoes' && (
              <ClientInfoTab
                company={company}
                onSaved={() =>
                  queryClient.invalidateQueries({
                    queryKey: companyDetailQueryOptions(company_id).queryKey,
                  })
                }
              />
            )}
            {activeTab === 'acessos' && (
              <CompanyMembersTab companyId={company_id} />
            )}
            {activeTab === 'cronograma' && (
              <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
                <p className="text-[13px]">Em breve.</p>
              </div>
            )}
            {activeTab === 'auditoria' && (
              <ClientAuditTab companyId={company_id} />
            )}
            {activeTab === 'administrativo' && canViewFinancial && (
              <ClientFinancialTab
                company={company}
                onSaved={() =>
                  queryClient.invalidateQueries({
                    queryKey: companyDetailQueryOptions(company_id).queryKey,
                  })
                }
              />
            )}
          </div>
        </div>
      </>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Excluir cliente"
          description={`Tem certeza que deseja excluir "${company.displayName}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteCompany.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </AdminPageContainer>
  );
}
