import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { MdAdd } from 'react-icons/md';

import { CreateCompanyModal } from '@/components/clients/modal.component';
import { CompaniesTable } from '@/components/clients/table.component';
import { AdminPageContainer } from '@/components/layout/page-container.component';
import { FormInput } from '@/components/ui/form-input.component';
import { companiesQueryOptions, companyKeys } from '@/queries/company.queries';
import { isAdmin } from '@/utils/isAdmin.util';

export const Route = createFileRoute('/admin/clients/')({
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.sessionUser)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(companiesQueryOptions()),
  component: AdminCompanies,
});

function AdminCompanies() {
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return companies;
    }
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.legalInformation.tradeName?.toLowerCase().includes(q) ||
        c.contact.email.toLowerCase().includes(q),
    );
  }, [companies, search]);

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

      <div className="mb-4">
        <FormInput
          label=""
          placeholder="Buscar por nome, empresa, e-mail..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        />
      </div>

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
