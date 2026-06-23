import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MdLockReset } from 'react-icons/md';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';

import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

import type { UserProfile, UserAccessLevel } from '@/models/user.model';
import type { AdminPermission } from '@/types/permissions.type';
import { ADMIN_PERMISSIONS_META } from '@/constants/permissions.const';

const FORM_ID = 'user-form';
const PERMISSION_GROUPS = Object.groupBy(
  ADMIN_PERMISSIONS_META,
  (p) => p.group,
);

interface UserFormValues {
  name: string;
  phone: string;
}

interface UserModalProps {
  targetUser: UserProfile;
  onClose: () => void;
  onSaved: (updated: Partial<UserProfile>) => void;
}

type SaveTask = {
  type: 'info' | 'level' | 'permissions';
  promise: Promise<void>;
};

export function UserModal({ targetUser, onClose, onSaved }: UserModalProps) {
  const { profile } = useAuth();

  const callerLevel = profile?.accessLevel ?? 'user';
  const targetLevel = targetUser.accessLevel;

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [selectedLevel, setSelectedLevel] =
    useState<UserAccessLevel>(targetLevel);
  const [localPermissions, setLocalPermissions] = useState<AdminPermission[]>(
    targetLevel === 'owner'
      ? ADMIN_PERMISSIONS_META.map((p) => p.key)
      : targetUser.permissions,
  );

  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: targetUser.name,
      phone: targetUser.phone ?? '',
    },
  });

  const permissionsReadOnly =
    callerLevel !== 'owner' || targetLevel === 'owner';

  const levelChanged = selectedLevel !== targetLevel;
  const permissionsChanged =
    !permissionsReadOnly &&
    selectedLevel === 'admin' &&
    (localPermissions.length !== targetUser.permissions.length ||
      localPermissions.some((p) => !targetUser.permissions.includes(p)));
  const hasChanges = isDirty || levelChanged || permissionsChanged;

  const onSubmit = async (values: UserFormValues) => {
    setIsSaving(true);
    try {
      const tasks: SaveTask[] = [];

      if (isDirty) {
        tasks.push({
          type: 'info',
          promise: UserService.updateUser({
            targetUid: targetUser.uid,
            name: values.name,
            phone: values.phone || undefined,
          }),
        });
      }
      if (levelChanged) {
        tasks.push({
          type: 'level',
          promise: UserService.updateAccessLevel(targetUser.uid, selectedLevel),
        });
      }
      if (permissionsChanged) {
        tasks.push({
          type: 'permissions',
          promise: UserService.updatePermissions(
            targetUser.uid,
            localPermissions,
          ),
        });
      }

      const results = await Promise.allSettled(tasks.map((t) => t.promise));

      const updates: Partial<UserProfile> = {};

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
        pushSnackbar({ type: 'success', message: 'Usuário atualizado!' });
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
      await UserService.sendRecoverPasswordEmail(targetUser.email);
      pushSnackbar({
        type: 'success',
        message: `E-mail de redefinição enviado para ${targetUser.email}.`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <Modal
      title="Editar usuário"
      onClose={onClose}
      formId={FORM_ID}
      isSaving={isSaving}
      saveDisabled={!hasChanges}
    >
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
            value={targetUser.email}
            disabled
            className="cursor-not-allowed opacity-60"
          />
          <FormInput
            label="CPF"
            value={targetUser.cpf}
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
            setSelectedLevel(e.target.value as UserAccessLevel)
          }
          disabled={callerLevel !== 'owner' || targetLevel === 'owner'}
        >
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
          <option value="owner">Proprietário</option>
        </FormSelect>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
              Permissões de acesso
            </span>
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
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
                  {group}
                </p>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg disabled:opacity-50"
        >
          {isSendingReset ? <Spinner size={14} /> : <MdLockReset size={16} />}
          Solicitar troca de senha
        </button>
      </div>
    </Modal>
  );
}
