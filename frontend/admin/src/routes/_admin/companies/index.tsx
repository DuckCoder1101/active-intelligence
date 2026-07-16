import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { MdAdd } from 'react-icons/md';

import { CreateCompanyModal } from '@/components/companies/modal.component';
import { CompaniesTable } from '@/components/companies/table.component';
import type { ListFilterOption } from '@/components/ui/list-toolbar.component';
import { ListToolbar } from '@/components/ui/list-toolbar.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { adminsQueryOptions } from '@/queries/admin.queries';
import { companiesQueryOptions, companyKeys } from '@/queries/company.queries';
import { contractedServicesQueryOptions } from '@/queries/contracted-service.queries';
import { tasksQueryOptions } from '@/queries/task.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import { getStaleCompanies } from '@/utils/dashboard-insights.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-clients'],
};

type CompaniesStageFilter = 'todos' | 'inativos';

const STAGE_FILTER_OPTIONS: ListFilterOption<CompaniesStageFilter>[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'inativos', label: 'Inativos' },
];

interface CompaniesSearchParams {
  filter?: CompaniesStageFilter;
}

export const Route = createFileRoute('/_admin/companies/')({
  ssr: false,
  validateSearch: (search): CompaniesSearchParams => ({
    filter: search.filter === 'inativos' ? 'inativos' : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(companiesQueryOptions()),
      context.queryClient.ensureQueryData(adminsQueryOptions()),
      context.queryClient.ensureQueryData(contractedServicesQueryOptions()),
      context.queryClient.ensureQueryData(tasksQueryOptions()),
    ]),
  component: AdminCompanies,
});

function AdminCompanies() {
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: tasks } = useSuspenseQuery(tasksQueryOptions());
  const { filter } = Route.useSearch();
  const activeFilter = filter ?? 'todos';
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const staleCompanyIds = useMemo(() => {
    const stale = getStaleCompanies(companies, tasks);
    return new Set(stale.map((s) => s.company.companyId));
  }, [companies, tasks]);

  const filtered = useMemo(() => {
    let list = companies;

    if (filter === 'inativos') {
      list = list.filter((c) => staleCompanyIds.has(c.companyId));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.legalInformation.tradeName?.toLowerCase().includes(q) ||
          c.contact.email.toLowerCase().includes(q),
      );
    }

    return list;
  }, [companies, staleCompanyIds, filter, search]);

  const handleSaved = () => {
    setShowModal(false);
    queryClient.invalidateQueries({ queryKey: companyKeys.all });
  };

  return (
    <AdminPageContainer>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
            Clientes
          </h1>
          <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
            Base central de clientes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary shrink-0 px-4 py-2.5"
        >
          <MdAdd size={18} />
          Novo cliente
        </button>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, empresa, e-mail..."
        filterOptions={STAGE_FILTER_OPTIONS}
        filterValue={activeFilter}
        onFilterChange={(value) =>
          navigate({
            search: { filter: value === 'todos' ? undefined : value },
            replace: true,
          })
        }
      />

      <CompaniesTable companies={filtered} isLoading={false} />

      {showModal && (
        <CreateCompanyModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </AdminPageContainer>
  );
}
