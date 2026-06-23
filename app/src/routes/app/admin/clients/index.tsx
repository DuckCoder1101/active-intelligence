import { useState, useMemo } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { FormInput } from '@/components/ui/form-input.component';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal.component';
import { CompaniesTable } from '@/components/admin/clients/table.component';
import { CompanyModal } from '@/components/admin/clients/modal.component';
import { useCompanies } from '@/hooks/useCompanies';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { Company } from '@/models/company.model';
import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = { minAccessLevel: 'admin', permissions: ['manage-clients'] };

export const Route = createFileRoute('/app/admin/clients/')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/app/unauthorized' });
    }
  },
  component: AdminCompanies,
});

function AdminCompanies() {
  const { companies, isLoading, deletingId, remove, refresh } = useCompanies();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.legalInformation.tradeName?.toLowerCase().includes(q) ||
        c.contact?.email?.toLowerCase().includes(q),
    );
  }, [companies, search]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCompany(null);
  };

  const handleSaved = () => {
    handleClose();
    refresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    await remove(deletingCompany.companyId);
    setDeletingCompany(null);
  };

  return (
    <>
      {/* Header */}
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
          className="flex shrink-0 items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          <MdAdd size={18} />
          Novo cliente
        </button>
      </div>

      {/* Search */}
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

      {/* Table */}
      <CompaniesTable
        companies={filtered}
        isLoading={isLoading}
        deletingId={deletingId}
        onEdit={handleEdit}
        onDelete={(companyId) => {
          const company = companies.find((c) => c.companyId === companyId);
          if (company) setDeletingCompany(company);
        }}
      />

      {/* Edit modal */}
      {showModal && (
        <CompanyModal
          company={editingCompany}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deletingCompany && (
        <ConfirmDeleteModal
          title="Excluir cliente"
          description={`Tem certeza que deseja excluir "${deletingCompany.displayName}"? Esta ação não pode ser desfeita.`}
          isDeleting={deletingId === deletingCompany.companyId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCompany(null)}
        />
      )}
    </>
  );
}
