import { useState, useMemo } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { FormInput } from '@/components/ui/form-input.component';
import { CompaniesTable } from '@/components/admin/clients/table.component';
import { CompanyModal } from '@/components/admin/clients/modal.component';
import { useCompanies } from '@/hooks/useCompanies';
import { AdminPageContainer } from '@/components/admin/page-container.component';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-clients'],
};

export const Route = createFileRoute('/admin/clients/')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: AdminCompanies,
});

function AdminCompanies() {
  const { companies, isLoading, refresh } = useCompanies();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
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
    refresh();
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

      <CompaniesTable companies={filtered} isLoading={isLoading} />

      {showModal && (
        <CompanyModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </AdminPageContainer>
  );
}
