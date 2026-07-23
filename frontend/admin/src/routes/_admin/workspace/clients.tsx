import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { MdOpenInNew } from 'react-icons/md';

import { AdminPageContainer } from '@/components/ui/page-container.component';
import { Spinner } from '@/components/ui/spinner.component';
import { ClientsList } from '@/components/workspace/clients/clients-list.component';
import { OperationalRecordForm } from '@/components/workspace/clients/operational-record-form.component';
import { formatPhone } from '@/formatters/formatPhone';
import { useWorkspaceFilter } from '@/hooks/use-workspace-filter.hook';
import type { Company } from '@/models/company.model';
import { adminsQueryOptions } from '@/queries/admin.queries';
import {
  companiesQueryOptions,
  operationalRecordQueryOptions,
} from '@/queries/company.queries';

export const Route = createFileRoute('/_admin/workspace/clients')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(companiesQueryOptions()),
      context.queryClient.ensureQueryData(adminsQueryOptions()),
    ]),
  component: WorkspaceClients,
});

function WorkspaceClients() {
  const { selectedCompanyIds, isSingleClient, singleClient } =
    useWorkspaceFilter();
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());

  const scopedCompanies = useMemo(() => {
    if (selectedCompanyIds.length === 0) {
      return companies.filter((c) => c.companyStage !== 'inactive');
    }
    return companies.filter((c) => selectedCompanyIds.includes(c.companyId));
  }, [companies, selectedCompanyIds]);

  return (
    <AdminPageContainer>
      {isSingleClient && singleClient ? (
        <SingleClientRecord client={singleClient} />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
              Clientes
            </h2>
            <p className="mt-2 text-[13px] text-text-sub">
              {selectedCompanyIds.length > 1
                ? `${selectedCompanyIds.length} clientes selecionados — escolha um para abrir o registro operacional`
                : 'Registro operacional de cada cliente — escolha um para abrir'}
            </p>
          </div>

          <ClientsList companies={scopedCompanies} />
        </>
      )}
    </AdminPageContainer>
  );
}

function SingleClientRecord({ client }: { client: Company }) {
  const { data: admins } = useSuspenseQuery(adminsQueryOptions());
  const { data: record, isLoading } = useQuery(
    operationalRecordQueryOptions(client.companyId),
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
            {client.displayName}
          </h2>
          <p className="mt-2 text-[13px] text-text-sub">
            {formatPhone(client.contact.phone)} · {client.contact.email}
          </p>
        </div>

        <Link
          to="/companies/$company_id"
          params={{ company_id: client.companyId }}
          className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-text-sub transition-colors hover:text-text"
        >
          Cadastro completo
          <MdOpenInNew size={13} />
        </Link>
      </div>

      {isLoading || !record ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={20} />
        </div>
      ) : (
        <OperationalRecordForm
          key={record.companyId}
          record={record}
          admins={admins}
        />
      )}
    </>
  );
}
