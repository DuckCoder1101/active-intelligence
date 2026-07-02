import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  MdAdd,
  MdOutlinePeople,
  MdEdit,
  MdLockReset,
  MdDeleteOutline,
} from 'react-icons/md';
import { IMaskInput } from 'react-imask';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useSnackbar } from '@/contexts/snackbar.context';
import { formatPhone } from '@/formatters/formatPhone';
import type { UserProfile } from '@/models/user-profile.model';
import {
  companyUsersQueryOptions,
  useDeleteCompanyUserMutation,
  useInviteCompanyUserMutation,
} from '@/queries/company-user.queries';
import {
  useSendPasswordResetMutation,
  useUpdateAccountMutation,
} from '@/queries/user.queries';

type Props = {
  companyId: string;
};

interface InviteFormValues {
  email: string;
}

interface EditFormValues {
  name: string;
  phone: string;
}

function InviteUserModal({
  companyId,
  onClose,
  onInvited,
}: {
  companyId: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const { pushSnackbar } = useSnackbar();
  const inviteUser = useInviteCompanyUserMutation(companyId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>();

  const onSubmit = (values: InviteFormValues) => {
    inviteUser.mutate(values.email, {
      onSuccess: () => {
        pushSnackbar({
          type: 'success',
          message: `Convite enviado para ${values.email}.`,
        });
        onInvited();
        onClose();
      },
    });
  };

  return (
    <Modal
      title="Convidar usuário"
      onClose={onClose}
      formId="invite-company-user-form"
      isSaving={inviteUser.isPending}
      saveLabel="Enviar convite"
      width="max-w-md"
    >
      <form
        id="invite-company-user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <p className="text-[13px] text-text-sub">
          Um e-mail será enviado com um link para o usuário definir sua senha e
          completar o cadastro. Ele terá acesso ao portal desta empresa.
        </p>
        <FormInput
          label="E-mail *"
          type="email"
          placeholder="usuario@email.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'E-mail obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido',
            },
          })}
        />
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserProfile;
  onClose: () => void;
  onSaved: (updated: Partial<UserProfile>) => void;
}) {
  const { pushSnackbar } = useSnackbar();
  const updateAccount = useUpdateAccountMutation();
  const sendPasswordReset = useSendPasswordResetMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
    },
  });

  const onSubmit = (values: EditFormValues) => {
    updateAccount.mutate(
      {
        targetId: user.uid,
        name: values.name,
        phone: values.phone || undefined,
      },
      {
        onSuccess: () => {
          pushSnackbar({ type: 'success', message: 'Usuário atualizado!' });
          onSaved({ name: values.name, phone: values.phone || undefined });
        },
      },
    );
  };

  const handleSendPasswordReset = () => {
    sendPasswordReset.mutate(user.email, {
      onSuccess: () => {
        pushSnackbar({
          type: 'success',
          message: `E-mail de redefinição enviado para ${user.email}.`,
        });
      },
    });
  };

  const footer = (
    <div className="flex items-center gap-3">
      <div className="ml-auto flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button
          form="edit-member-form"
          type="submit"
          disabled={updateAccount.isPending || !isDirty}
          className="btn-primary"
        >
          {updateAccount.isPending && <Spinner size={12} />}
          Salvar
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      title="Editar usuário"
      onClose={onClose}
      footer={footer}
      width="max-w-md"
    >
      <form
        id="edit-member-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormInput
          label="Nome *"
          placeholder="Nome completo"
          error={errors.name?.message}
          {...register('name', { required: 'Nome obrigatório' })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="E-mail"
            type="email"
            value={user.email}
            disabled
            className="cursor-not-allowed opacity-60"
          />
          <FormInput
            label="CPF"
            value={user.cpf}
            disabled
            className="cursor-not-allowed opacity-60"
          />
        </div>

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <FormInput
              as={IMaskInput}
              mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
              label="Celular"
              type="tel"
              placeholder="(00) 00000-0000"
              error={errors.phone?.message}
              {...field}
              onAccept={(value: string) => field.onChange(value)}
            />
          )}
        />
      </form>

      <div className="mt-5 border-t border-border pt-5">
        <button
          type="button"
          onClick={handleSendPasswordReset}
          disabled={sendPasswordReset.isPending}
          className="btn-ghost-border w-full justify-center px-4 py-2.5"
        >
          {sendPasswordReset.isPending ? <Spinner size={14} /> : <MdLockReset size={16} />}
          Solicitar troca de senha
        </button>
      </div>
    </Modal>
  );
}

export function CompanyMembersTab({ companyId }: Props) {
  const { data: users = [], isLoading } = useQuery(companyUsersQueryOptions(companyId));
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const queryClient = useQueryClient();
  const { pushSnackbar } = useSnackbar();
  const deleteCompanyUser = useDeleteCompanyUserMutation(companyId);

  const handleSaved = (updated: Partial<UserProfile>) => {
    if (!editingUser) {
      return;
    }
    queryClient.setQueryData<UserProfile[]>(
      companyUsersQueryOptions(companyId).queryKey,
      (prev) =>
        prev?.map((u) => (u.uid === editingUser.uid ? { ...u, ...updated } : u)),
    );
    setEditingUser(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) {
      return;
    }
    deleteCompanyUser.mutate(deletingUser.uid, {
      onSuccess: () => {
        pushSnackbar({
          type: 'success',
          message: `Usuário ${deletingUser.name} removido.`,
        });
        setDeletingUser(null);
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Usuários com acesso a esta empresa
        </p>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          <MdAdd size={15} />
          Convidar usuário
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size={20} />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
          <MdOutlinePeople size={24} className="text-text-muted" />
          <p className="text-[13px] text-text-muted">
            Nenhum usuário cadastrado nesta empresa.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {users.map((u) => (
            <li key={u.uid} className="flex items-center gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/15 text-[11px] font-bold text-orange">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text">
                  {u.name}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {u.email}
                </p>
              </div>
              {u.phone && (
                <span className="shrink-0 text-[12px] text-text-sub">
                  {formatPhone(u.phone)}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingUser(u)}
                className="ml-1 shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
                title="Editar usuário"
              >
                <MdEdit size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeletingUser(u)}
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                title="Excluir usuário"
              >
                <MdDeleteOutline size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showInvite && (
        <InviteUserModal
          companyId={companyId}
          onClose={() => setShowInvite(false)}
          onInvited={() =>
            queryClient.invalidateQueries({
              queryKey: companyUsersQueryOptions(companyId).queryKey,
            })
          }
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      )}

      {deletingUser && (
        <ConfirmDeleteModal
          title="Excluir usuário"
          description={`Excluir ${deletingUser.name} (${deletingUser.email})? O acesso será removido permanentemente.`}
          isDeleting={deleteCompanyUser.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
