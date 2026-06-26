import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MdLockReset, MdDelete } from 'react-icons/md';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';

import AdminService from '@/services/admin.service';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

import type { AdminProfile, AdminAccessLevel } from '@/models/admin.model';
import type { AdminPermission } from '@/types/permissions.type';
import { ADMIN_PERMISSIONS_META } from '@/constants/permissions.const';

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

type SaveTask = {
  type: 'info' | 'level' | 'permissions';
  promise: Promise<void>;
};

export function AdminModal({
  targetAdmin,
  onClose,
  onSaved,
  onDelete,
}: AdminModalProps) {
  const { userProfile: profile } = useAuth();

  const callerLevel = (profile as AdminProfile | null)?.accessLevel ?? 'admin';
  const targetLevel = targetAdmin.accessLevel;

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [selectedLevel, setSelectedLevel] =
    useState<AdminAccessLevel>(targetLevel);
  const [localPermissions, setLocalPermissions] = useState<AdminPermission[]>(
    targetLevel === 'owner'
      ? ADMIN_PERMISSIONS_META.map((p) => p.key)
      : targetAdmin.permissions,
  );

  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

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
  const levelChanged = selectedLevel !== targetLevel;
  const permissionsChanged =
    !permissionsReadOnly &&
    selectedLevel === 'admin' &&
    (localPermissions.length !== targetAdmin.permissions.length ||
      localPermissions.some((p) => !targetAdmin.permissions.includes(p)));
  const hasChanges = isDirty || levelChanged || permissionsChanged;

  const onSubmit = async (values: AdminFormValues) => {
    setIsSaving(true);
    try {
      const tasks: SaveTask[] = [];

      if (isDirty) {
        tasks.push({
          type: 'info',
          promise: AdminService.updateAdmin({
            targetId: targetAdmin.uid,
            name: values.name,
            phone: values.phone || undefined,
          }),
        });
      }
      if (levelChanged) {
        tasks.push({
          type: 'level',
          promise: AdminService.updateAccessLevel(
            targetAdmin.uid,
            selectedLevel,
          ),
        });
      }
      if (permissionsChanged) {
        tasks.push({
          type: 'permissions',
          promise: AdminService.updatePermissions(
            targetAdmin.uid,
            localPermissions,
          ),
        });
      }

      const results = await Promise.allSettled(tasks.map((t) => t.promise));
      const updates: Partial<AdminProfile> = {};

      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          handleError(result.reason);
        } else {
          switch (tasks[i].type) {
            case 'info':
              updates.name = values.name;
              updates.phone = values.phone || undefined;
              break;
            case 'level':
              updates.accessLevel = selectedLevel;
              break;
            case 'permissions':
              updates.permissions = localPermissions;
              break;
          }
        }
      });

      if (results.some((r) => r.status === 'fulfilled')) {
        pushSnackbar({ type: 'success', message: 'Administrador atualizado!' });
        onSaved(updates);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = (key: AdminPermission) => {
    setLocalPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleSendPasswordReset = async () => {
    setIsSendingReset(true);
    try {
      await UserService.sendRecoverPasswordEmail(targetAdmin.email);
      pushSnackbar({
        type: 'success',
        message: `E-mail de redefinição enviado para ${targetAdmin.email}.`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSendingReset(false);
    }
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
          disabled={isSaving || !hasChanges}
          className="btn-primary"
        >
          {isSaving && <Spinner size={12} />}
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
        <FormSelect
          label="Nível de acesso"
          value={selectedLevel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedLevel(e.target.value as AdminAccessLevel)
          }
          disabled={callerLevel !== 'owner' || targetLevel === 'owner'}
        >
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
