import { useState, useMemo } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AdminPageContainer } from '@/routes/app/admin';
import { MdAdd } from 'react-icons/md';

import { FormInput } from '@/components/ui/form-input.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { UsersTable } from '@/components/admin/users/table.component';
import { UserModal } from '@/components/admin/users/info-modal.component';
import { InviteUserModal } from '@/components/admin/users/invite-modal.component';
import { useUsers } from '@/hooks/useUsers';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { UserProfile } from '@/models/user.model';
import type { RouteAccessLevel } from '@/types/route-access.type';

const ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-users'],
};

export const Route = createFileRoute('/app/admin/users/')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/app/unauthorized' });
    }
  },
  component: AdminUsers,
});

function AdminUsers() {
  const { users, isLoading, deletingId, remove, patchUser } = useUsers();

  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cpf.includes(q),
    );
  }, [users, search]);

  const handleDeleteFromModal = () => {
    if (!editingUser) return;
    const user = editingUser;
    setEditingUser(null);
    setDeletingUser(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    await remove(deletingUser.uid);
    setDeletingUser(null);
  };

  const handleSaved = (updated: Partial<UserProfile>) => {
    if (!editingUser) return;
    patchUser(editingUser.uid, updated);
    setEditingUser(null);
  };

  return (
    <AdminPageContainer>
      <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
            Usuários
          </h1>
          <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
            Gerenciamento de usuários do sistema
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          <MdAdd size={18} />
          Convidar usuário
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

      <UsersTable
        users={filtered}
        isLoading={isLoading}
        onEdit={setEditingUser}
      />

      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}

      {editingUser && (
        <UserModal
          targetUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
          onDelete={handleDeleteFromModal}
        />
      )}

      {deletingUser && (
        <ConfirmDeleteModal
          title="Excluir usuário"
          description={`Tem certeza que deseja excluir "${deletingUser.name}"? Esta ação não pode ser desfeita.`}
          isDeleting={deletingId === deletingUser.uid}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
      </>
    </AdminPageContainer>
  );
}
