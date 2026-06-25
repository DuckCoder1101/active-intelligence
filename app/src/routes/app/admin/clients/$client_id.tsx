import { useState, useEffect, useRef } from 'react';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { AdminPageContainer } from '@/routes/app/admin';
import {
  MdArrowBack,
  MdOutlineOpenInNew,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineBadge,
  MdOutlineLocationOn,
  MdOutlinePeopleAlt,
  MdOutlineCalendarMonth,
  MdOutlineHistory,
  MdDelete,
} from 'react-icons/md';

import { Tabs } from '@/components/ui/tabs.component';
import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { ClientInfoTab } from '@/components/admin/clients/client/info-tab.component';
import { CompanyMembersTab } from '@/components/admin/clients/client/members-tab.component';
import { ClientAuditTab } from '@/components/admin/clients/client/audit-tab.component';
import CompanyService from '@/services/company.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { formatCNPJ } from '@/formatters/formatCnpj';
import { formatPhone } from '@/formatters/formatPhone';

import type { Company } from '@/models/company.model';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = { minAccessLevel: 'admin' };

export const Route = createFileRoute('/app/admin/clients/$client_id')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/app/unauthorized' });
    }
  },
  component: ClientDetailPage,
});

const TABS = [
  { id: 'informacoes', label: 'Informações', icon: MdOutlineLocationOn },
  { id: 'acessos', label: 'Acessos', icon: MdOutlinePeopleAlt },
  { id: 'cronograma', label: 'Cronograma', icon: MdOutlineCalendarMonth },
  { id: 'auditoria', label: 'Auditoria', icon: MdOutlineHistory },
];

function ClientDetailPage() {
  const { client_id } = Route.useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('informacoes');
  const handleError = useHandleError();

  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const loadCompany = () => {
    setIsLoading(true);
    CompanyService.getCompany(client_id)
      .then(setCompany)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCompany();
  }, [client_id]);

  const handleDeleteConfirm = async () => {
    if (!company) return;
    setIsDeleting(true);
    try {
      await CompanyService.deleteCompany(company.companyId);
      navigate({ to: '/app/admin/clients' });
    } catch (err) {
      handleError(err);
      setIsDeleting(false);
    }
  };

  return (
    <AdminPageContainer>
      <>
      <Link
        to="/app/admin/clients"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-sub transition-colors hover:text-text"
      >
        <MdArrowBack size={15} />
        Todos os clientes
      </Link>

      {isLoading || !company ? (
        <div className="mt-10 flex justify-center">
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {/* Header card */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-6">
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
                  {company.contact?.email && (
                    <span className="flex items-center gap-1.5">
                      <MdOutlineEmail size={14} className="shrink-0" />
                      {company.contact.email}
                    </span>
                  )}
                  {company.contact?.phone && (
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
                <button
                  type="button"
                  disabled
                  title="Em breve"
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-text-sub opacity-50"
                >
                  <MdOutlineOpenInNew size={15} />
                  Ver portal
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10"
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
                <ClientInfoTab company={company} onSaved={loadCompany} />
              )}
              {activeTab === 'acessos' && (
                <CompanyMembersTab companyId={client_id} />
              )}
              {activeTab === 'cronograma' && (
                <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
                  <p className="text-[13px]">Em breve.</p>
                </div>
              )}
              {activeTab === 'auditoria' && (
                <ClientAuditTab companyId={client_id} />
              )}
            </div>
          </div>
        </>
      )}

      {showDeleteConfirm && company && (
        <ConfirmDeleteModal
          title="Excluir cliente"
          description={`Tem certeza que deseja excluir "${company.displayName}"? Esta ação não pode ser desfeita.`}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      </>
    </AdminPageContainer>
  );
}
