import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MdAdd, MdOutlinePeople, MdEdit, MdLockReset, MdDeleteOutline } from 'react-icons/md';

import CompanyUserService from '@/services/company-user.service';
import UserService from '@/services/user.service';
import { Modal } from '@/components/layout/modal.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

import type { UserProfile } from '@/models/user-profile.model';
import { formatPhone } from '@/formatters/formatPhone';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>();

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmitting(true);
    try {
      await CompanyUserService.inviteCompanyUser(values.email, companyId);
      await UserService.sendRecoverPasswordEmail(values.email);
      pushSnackbar({
        type: 'success',
        message: `Convite enviado para ${values.email}.`,
      });
      onInvited();
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Convidar usuário"
      onClose={onClose}
      formId="invite-company-user-form"
      isSaving={isSubmitting}
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

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

  const onSubmit = async (values: EditFormValues) => {
    setIsSaving(true);
    try {
      await UserService.updateAccount({
        targetId: user.uid,
        name: values.name,
        phone: values.phone || undefined,
      });
      pushSnackbar({ type: 'success', message: 'Usuário atualizado!' });
      onSaved({ name: values.name, phone: values.phone || undefined });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setIsSendingReset(true);
    try {
      await UserService.sendRecoverPasswordEmail(user.email);
      pushSnackbar({
        type: 'success',
        message: `E-mail de redefinição enviado para ${user.email}.`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSendingReset(false);
    }
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
          disabled={isSaving || !isDirty}
          className="btn-primary"
        >
          {isSaving && <Spinner size={12} />}
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
          disabled={isSendingReset}
          className="btn-ghost-border w-full justify-center px-4 py-2.5"
        >
          {isSendingReset ? <Spinner size={14} /> : <MdLockReset size={16} />}
          Solicitar troca de senha
        </button>
      </div>
    </Modal>
  );
}

export function CompanyMembersTab({ companyId }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;
  const { pushSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setIsLoading(true);
    CompanyUserService.listCompanyUsers(companyId)
      .then(setUsers)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (updated: Partial<UserProfile>) => {
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === editingUser.uid ? { ...u, ...updated } : u,
      ),
    );
    setEditingUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await UserService.deleteAccount({ targetId: deletingUser.uid });
      setUsers((prev) => prev.filter((u) => u.uid !== deletingUser.uid));
      pushSnackbar({ type: 'success', message: `Usuário ${deletingUser.name} removido.` });
      setDeletingUser(null);
    } catch (err) {
      handleErrorRef.current(err);
    } finally {
      setIsDeleting(false);
    }
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
          onInvited={load}
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
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
