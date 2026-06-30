import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MdArrowBack, MdOutlineCameraAlt, MdDelete } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { UserAvatar } from '@/components/ui/user-avatar.component';
import { Modal } from '@/components/layout/modal.component';
import { useAuth } from '@/contexts/auth.context';
import { FormInput } from '@/components/ui/form-input.component';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';
import { formatAccessLevel } from '@/formatters/formatAccessLevel';

export const Route = createFileRoute('/user/profile')({
  component: UserProfile,
});

type PersonalInfoFields = {
  name: string;
  phone: string;
};

function UserProfile() {
  // All hooks must be called before any conditional return (Rules of Hooks)
  const { userProfile, downloadUserProfile, claims, isLoadingProfile } =
    useAuth();
  const router = useRouter();
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFields>({ defaultValues: { name: '', phone: '' } });

  const isAdmin =
    claims?.accessLevel === 'admin' || claims?.accessLevel === 'owner';

  useEffect(() => {
    if (!userProfile) return;
    reset({
      name: userProfile.name,
      phone: userProfile.phone ?? '',
    });
  }, [userProfile, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      await UserService.updateAvatar(userProfile.uid, file);
      downloadUserProfile();
      pushSnackbar({ type: 'success', message: 'Foto de perfil atualizada!' });
      setIsPhotoModalOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoDelete = async () => {
    if (!userProfile) return;
    setIsDeletingPhoto(true);
    try {
      await UserService.deleteAvatar(userProfile.uid);
      downloadUserProfile();
      pushSnackbar({ type: 'success', message: 'Foto de perfil removida.' });
      setIsPhotoModalOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const onSubmitPersonalInfo = async (data: PersonalInfoFields) => {
    if (!userProfile) return;
    setIsSaving(true);
    try {
      await UserService.updateAccount({ targetId: userProfile.uid, ...data });
      downloadUserProfile();
      pushSnackbar({ type: 'success', message: 'Perfil atualizado!' });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-1.5 text-[13px] text-text-sub transition-colors hover:text-text"
        >
          <MdArrowBack size={16} />
          Voltar
        </button>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {isLoadingProfile || !userProfile ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-orange" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
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
                  <MdOutlineCameraAlt size={22} className="text-white" />
                </div>
              </button>

              <div className="text-center sm:text-left">
                <p className="text-[19px] font-bold text-text">
                  {userProfile.name}
                </p>
                <p className="mt-0.5 text-[13px] text-text-sub">
                  {userProfile.email}
                </p>
                {isAdmin && (
                  <span className="mt-2 inline-block rounded-full bg-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-orange">
                    {formatAccessLevel(claims.accessLevel!)}
                  </span>
                )}
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-[16px] font-bold text-text sm:text-[18px]">
                  Informações Pessoais
                </h2>
                <span className="text-[11px] text-text-muted sm:text-[12px]">
                  Atualize seu nome e telefone de contato.
                </span>
              </div>
              <form
                onSubmit={handleSubmit(onSubmitPersonalInfo)}
                className="space-y-4"
              >
                <div className="form-grid">
                  <FormInput
                    label="Nome completo"
                    placeholder="Seu nome"
                    error={errors.name?.message}
                    {...register('name', { required: 'Nome obrigatório' })}
                  />
                  <FormInput
                    label="Telefone"
                    placeholder="(00) 00000-0000"
                    {...register('phone')}
                  />
                </div>
                <div className="form-grid">
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
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving && <Spinner size={13} />}
                    Salvar alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {isPhotoModalOpen && userProfile && (
        <Modal
          title="Foto de perfil"
          onClose={() => setIsPhotoModalOpen(false)}
          width="max-w-sm"
        >
          <div className="flex flex-col items-center gap-6 py-2">
            <UserAvatar
              name={userProfile.name}
              photoUrl={userProfile.avatarUrl}
              className="h-24 w-24 border-2 border-border bg-orange/10"
              initialsClassName="text-[26px] text-orange"
            />

            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                disabled={isUploadingPhoto || isDeletingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full justify-center"
              >
                {isUploadingPhoto ? (
                  <Spinner size={13} />
                ) : (
                  <MdOutlineCameraAlt size={16} />
                )}
                Atualizar foto de perfil
              </button>

              <button
                type="button"
                disabled={
                  !userProfile.avatarUrl || isDeletingPhoto || isUploadingPhoto
                }
                onClick={handlePhotoDelete}
                className="btn-danger w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDeletingPhoto ? (
                  <Spinner size={13} />
                ) : (
                  <MdDelete size={16} />
                )}
                Remover foto de perfil
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
