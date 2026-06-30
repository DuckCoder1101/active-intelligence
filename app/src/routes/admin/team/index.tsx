import { useState, useMemo } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { FormInput } from '@/components/ui/form-input.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { AdminsTable } from '@/components/admin/team/table.component';
import { AdminModal } from '@/components/admin/team/info-modal.component';
import { InviteAdminModal } from '@/components/admin/team/invite-modal.component';
import { useAdmins } from '@/hooks/useAdmins';
import { AdminPageContainer } from '@/components/admin/page-container.component';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { AdminProfile } from '@/models/admin.model';
import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-team'],
};

export const Route = createFileRoute('/admin/team/')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: AdminTeam,
});

function AdminTeam() {
  const { admins, isLoading, deletingId, remove, patchAdmin } = useAdmins();

  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminProfile | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return admins;
    const q = search.toLowerCase();
    return admins.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cpf.includes(q),
    );
  }, [admins, search]);

  const handleDeleteFromModal = () => {
    if (!editingAdmin) return;
    const admin = editingAdmin;
    setEditingAdmin(null);
    setDeletingAdmin(admin);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    await remove(deletingAdmin.uid);
    setDeletingAdmin(null);
  };

  const handleSaved = (updated: Partial<AdminProfile>) => {
    if (!editingAdmin) return;
    patchAdmin(editingAdmin.uid, updated);
    setEditingAdmin(null);
  };

  return (
    <AdminPageContainer>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
            Administradores
          </h1>
          <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
            Gerenciamento de administradores do sistema
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-primary shrink-0 px-4 py-2.5"
        >
          <MdAdd size={18} />
          Convidar admin
        </button>
      </div>

      <div className="mb-4">
        <FormInput
          label=""
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <AdminsTable
        admins={filtered}
        isLoading={isLoading}
        onEdit={setEditingAdmin}
      />

      {showInvite && <InviteAdminModal onClose={() => setShowInvite(false)} />}

      {editingAdmin && (
        <AdminModal
          targetAdmin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={handleSaved}
          onDelete={handleDeleteFromModal}
        />
      )}

      {deletingAdmin && (
        <ConfirmDeleteModal
          title="Excluir administrador"
          description={`Tem certeza que deseja excluir "${deletingAdmin.name}"? Esta ação não pode ser desfeita.`}
          isDeleting={deletingId === deletingAdmin.uid}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingAdmin(null)}
        />
      )}
    </AdminPageContainer>
  );
}
