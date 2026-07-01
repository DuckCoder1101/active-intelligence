import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MdLockReset, MdDelete } from 'react-icons/md';
import { IMaskInput } from 'react-imask';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { ADMIN_PERMISSIONS_META } from '@/constants/permissions.const';
import { useAuth } from '@/contexts/auth.context';
import { useSnackbar } from '@/contexts/snackbar.context';
import type { AdminProfile } from '@/models/admin.model';
import {
  useUpdateAdminInfoMutation,
  useUpdatePermissionsMutation,
} from '@/queries/admin.queries';
import { useSendPasswordResetMutation } from '@/queries/user.queries';
import type { AdminPermission } from '@/types/permissions.type';

const FORM_ID = 'admin-form';
const PERMISSION_GROUPS = Object.groupBy(
  ADMIN_PERMISSIONS_META,
  (p) => p.group,
);

interface AdminFormValues {
  name: string;
  phone: string;
}

interface AdminModalProps {
  targetAdmin: AdminProfile;
  onClose: () => void;
  onSaved: (updated: Partial<AdminProfile>) => void;
  onDelete?: () => void;
}

export function AdminModal({
  targetAdmin,
  onClose,
  onSaved,
  onDelete,
}: AdminModalProps) {
  const { userProfile: profile } = useAuth();

  const callerLevel = (profile as AdminProfile | null)?.accessLevel ?? 'admin';
  const targetLevel = targetAdmin.accessLevel;

  const [localPermissions, setLocalPermissions] = useState<AdminPermission[]>(
    targetLevel === 'owner'
      ? ADMIN_PERMISSIONS_META.map((p) => p.key)
      : targetAdmin.permissions,
  );

  const { pushSnackbar } = useSnackbar();
  const updateAdminInfo = useUpdateAdminInfoMutation();
  const updatePermissions = useUpdatePermissionsMutation();
  const sendPasswordReset = useSendPasswordResetMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AdminFormValues>({
    defaultValues: {
      name: targetAdmin.name,
      phone: targetAdmin.phone ?? '',
    },
  });

  const permissionsReadOnly =
    callerLevel !== 'owner' || targetLevel === 'owner';

  const permissionsChanged =
    !permissionsReadOnly &&
    (localPermissions.length !== targetAdmin.permissions.length ||
      localPermissions.some((p) => !targetAdmin.permissions.includes(p)));

  const hasChanges = isDirty || permissionsChanged;

  const onSubmit = async (values: AdminFormValues) => {
    const jobs: Array<Promise<'info' | 'permissions'>> = [];

    if (isDirty) {
      jobs.push(
        updateAdminInfo
          .mutateAsync({
            targetId: targetAdmin.uid,
            name: values.name,
            phone: values.phone || undefined,
          })
          .then(() => 'info' as const),
      );
    }

    if (permissionsChanged) {
      jobs.push(
        updatePermissions
          .mutateAsync({ uid: targetAdmin.uid, permissions: localPermissions })
          .then(() => 'permissions' as const),
      );
    }

    const results = await Promise.allSettled(jobs);
    const updates: Partial<AdminProfile> = {};
    let anySucceeded = false;

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        continue;
      }
      anySucceeded = true;
      if (result.value === 'info') {
        updates.name = values.name;
        updates.phone = values.phone || undefined;
      } else {
        updates.permissions = localPermissions;
      }
    }

    if (anySucceeded) {
      pushSnackbar({ type: 'success', message: 'Administrador atualizado!' });
      onSaved(updates);
    }
  };

  const handleTogglePermission = (key: AdminPermission) => {
    setLocalPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleSendPasswordReset = () => {
    sendPasswordReset.mutate(targetAdmin.email, {
      onSuccess: () => {
        pushSnackbar({
          type: 'success',
          message: `E-mail de redefinição enviado para ${targetAdmin.email}.`,
        });
      },
    });
  };

  const canDelete =
    onDelete &&
    callerLevel === 'owner' &&
    targetLevel !== 'owner' &&
    targetAdmin.uid !== profile?.uid;

  const footer = (
    <div className="flex items-center gap-3">
      {canDelete && (
        <button type="button" onClick={onDelete} className="btn-danger">
          <MdDelete size={16} />
          Excluir
        </button>
      )}
      <div className="ml-auto flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button
          form={FORM_ID}
          type="submit"
          disabled={updateAdminInfo.isPending || updatePermissions.isPending || !hasChanges}
          className="btn-primary"
        >
          {(updateAdminInfo.isPending || updatePermissions.isPending) && <Spinner size={12} />}
          Salvar
        </button>
      </div>
    </div>
  );

  return (
    <Modal title="Editar administrador" onClose={onClose} footer={footer}>
      <form
        id={FORM_ID}
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
            value={targetAdmin.email}
            disabled
            className="cursor-not-allowed opacity-60"
          />
          <FormInput
            label="CPF"
            value={targetAdmin.cpf}
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

      <div className="mt-6 space-y-5 border-t border-border pt-5">
        <FormSelect label="Nível de acesso" value={targetLevel} disabled>
          <option value="admin">Administrador</option>
          <option value="owner">Proprietário</option>
        </FormSelect>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="form-label">Permissões de acesso</span>
          </div>

          {targetLevel === 'owner' && (
            <p className="mb-3 text-[12px] text-text-muted">
              Owners têm acesso total a todos os módulos.
            </p>
          )}

          <div className="space-y-2">
            {Object.entries(PERMISSION_GROUPS).map(([group, perms = []]) => (
              <div
                key={group}
                className="rounded-xl border border-border bg-bg/50 p-3"
              >
                <p className="form-label mb-2.5">{group}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {perms.map((p) => {
                    const checked =
                      targetLevel === 'owner' ||
                      localPermissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className={[
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors',
                          checked
                            ? 'border-orange/30 bg-orange/5 text-text'
                            : 'border-border bg-card text-text-muted',
                          permissionsReadOnly
                            ? 'cursor-default'
                            : 'hover:border-orange/20',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={permissionsReadOnly}
                          onChange={() =>
                            !permissionsReadOnly &&
                            handleTogglePermission(p.key)
                          }
                          className="accent-orange"
                        />
                        {p.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

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
