import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdOutlineCameraAlt, MdOutlineLogout } from 'react-icons/md';
import { toast } from 'react-toastify';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PhoneInput } from '@/components/ui/phone-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { UserAvatar } from '@/components/ui/user-avatar.component';
import { useAuth } from '@/contexts/auth.context';
import { formatAccessLevel } from '@/formatters/formatAccessLevel';
import {
  useDeleteAvatarMutation,
  useSignoutMutation,
  useUpdateAccountMutation,
  useUpdateAvatarMutation,
} from '@/queries/user.queries';

type PersonalInfoFields = {
  name: string;
  phone: string;
};

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { userProfile, downloadUserProfile, claims, isLoadingProfile } =
    useAuth();
  const navigate = useNavigate();
  const updateAvatar = useUpdateAvatarMutation();
  const deleteAvatar = useDeleteAvatarMutation();
  const updateAccount = useUpdateAccountMutation();
  const signout = useSignoutMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFields>({ defaultValues: { name: '', phone: '' } });

  const isAdmin =
    claims?.accessLevel === 'admin' || claims?.accessLevel === 'owner';

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    reset({
      name: userProfile.name,
      phone: userProfile.phone ?? '',
    });
  }, [userProfile, reset]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userProfile) {
      return;
    }
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    updateAvatar.mutate(
      { uid: userProfile.uid, file },
      {
        onSuccess: () => {
          downloadUserProfile();
          toast.success('Foto de perfil atualizada!');
        },
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      },
    );
  };

  const handlePhotoDelete = () => {
    if (!userProfile) {
      return;
    }
    deleteAvatar.mutate(userProfile.uid, {
      onSuccess: () => {
        downloadUserProfile();
        toast.success('Foto de perfil removida.');
      },
    });
  };

  const handleLogout = () => {
    signout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/auth/signin' }),
    });
  };

  const onSubmit = (data: PersonalInfoFields) => {
    if (!userProfile) {
      return;
    }

    updateAccount.mutate(
      { targetId: userProfile.uid, ...data },
      {
        onSuccess: () => {
          downloadUserProfile();
          toast.success('Perfil atualizado!');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      title="Meu perfil"
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={signout.isPending}
            className="btn-ghost flex items-center gap-1 px-2.5 py-1.5 text-[11px] sm:gap-1.5 sm:px-5 sm:py-2 sm:text-[13px]"
          >
            {signout.isPending ? (
              <Spinner size={12} />
            ) : (
              <MdOutlineLogout size={14} />
            )}
            Sair
          </button>

          <div className="flex gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-2.5 py-1.5 text-[11px] sm:px-5 sm:py-2 sm:text-[13px]"
            >
              Cancelar
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={updateAccount.isPending}
              className="btn-primary px-2.5 py-1.5 text-[11px] sm:px-5 sm:py-2 sm:text-[13px]"
            >
              {updateAccount.isPending && <Spinner size={12} />}
              <span className="sm:hidden">Salvar</span>
              <span className="hidden sm:inline">Salvar alterações</span>
            </button>
          </div>
        </div>
      }
    >
      {isLoadingProfile || !userProfile ? (
        <div className="flex justify-center py-10">
          <Spinner className="text-orange" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={updateAvatar.isPending}
              title="Alterar foto de perfil"
              className="group relative shrink-0"
            >
              <UserAvatar
                name={userProfile.name}
                photoUrl={userProfile.avatarUrl}
                className="h-20 w-20 border-2 border-border bg-orange/10"
                initialsClassName="text-[22px] text-orange"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {updateAvatar.isPending ? (
                  <Spinner size={18} className="text-white" />
                ) : (
                  <MdOutlineCameraAlt size={22} className="text-white" />
                )}
              </div>
            </button>

            {userProfile.avatarUrl && (
              <button
                type="button"
                onClick={handlePhotoDelete}
                disabled={deleteAvatar.isPending}
                className="text-[11px] text-danger hover:underline disabled:opacity-50"
              >
                {deleteAvatar.isPending ? (
                  <Spinner size={11} />
                ) : (
                  'Remover foto'
                )}
              </button>
            )}

            {isAdmin && (
              <span className="mt-1 inline-block rounded-full bg-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-orange">
                {formatAccessLevel(claims.accessLevel!)}
              </span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <form
            id="profile-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormInput
              label="Nome completo"
              placeholder="Seu nome"
              error={errors.name?.message}
              {...register('name', { required: 'Nome obrigatório' })}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput label="Telefone" {...field} />
              )}
            />
            <FormInput
              label="E-mail"
              value={userProfile.email}
              onChange={() => {}}
              readOnly
              disabled
              className="cursor-not-allowed opacity-60"
            />
            <FormInput
              label="CPF"
              value={userProfile.cpf}
              onChange={() => {}}
              readOnly
              disabled
              className="cursor-not-allowed opacity-60"
            />
          </form>
        </div>
      )}
    </Modal>
  );
}
