import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  MdOutlineCameraAlt,
  MdOutlineDiamond,
  MdOutlineGridView,
  MdOutlineBusiness,
} from 'react-icons/md';

import { useMyCompanies } from '@/hooks/useMyCompanies';
import { Spinner } from '@/components/ui/spinner.component';

import { useAuth } from '@/contexts/auth.context';
import { FormInput } from '@/components/ui/form-input.component';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';

export const Route = createFileRoute('/app/user/profile')({
  component: UserProfile,
});

type PersonalInfoFields = {
  name: string;
  phone: string;
};

function UserProfile() {
  const { profile, isLoadingProfile } = useAuth();
  const handleError = useHandleError();
  const { companies: myCompanies, isLoading: isLoadingCompanies } =
    useMyCompanies();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFields>({ defaultValues: { name: '', phone: '' } });

  useEffect(() => {
    if (!profile) return;
    reset({ name: profile.name, phone: profile.phone ?? '' });
  }, [profile, reset]);

  useEffect(() => {
    if (!profile?.uid) return;
    setIsLoadingPhoto(true);
    UserService.getProfilePhotoUrl(profile.uid)
      .then(setPhotoUrl)
      .finally(() => setIsLoadingPhoto(false));
  }, [profile?.uid]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.uid) return;
    setIsUploadingPhoto(true);
    try {
      const url = await UserService.updateProfilePhoto(profile.uid, file);
      setPhotoUrl(url);
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmitPersonalInfo = (_data: PersonalInfoFields) => {
    // TODO: Implement save - call UserService to update name and phone in Firestore
  };

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  if (isLoadingProfile) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
          Meu <span className="text-orange">Perfil</span>
        </h1>
        <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
          Gerencie suas informações pessoais e acesso aos painéis.
        </p>
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-bg">
              {isLoadingPhoto ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner size={16} className="text-orange" />
                </div>
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-orange/10">
                  <span className="text-[22px] font-bold text-orange">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title="Alterar foto"
              className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {isUploadingPhoto ? (
                <Spinner size={10} />
              ) : (
                <MdOutlineCameraAlt size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-[19px] font-bold text-text">
              {profile?.name ?? '—'}
            </p>
            <p className="mt-0.5 text-[13px] text-text-sub">
              {profile?.email ?? '—'}
            </p>
            <span className="mt-2 inline-block rounded-full bg-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-orange">
              {profile?.accessLevel === 'admin' ? 'Administrador' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* Admin access banner */}
        {profile?.accessLevel === 'admin' && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-orange/20 bg-orange/5 p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/10">
                <MdOutlineDiamond size={20} className="text-orange" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-text">
                  Painel de Administrador
                </p>
                <p className="text-[12px] text-text-sub">
                  Acesse a visão completa do Active OS.
                </p>
              </div>
            </div>
            <Link
              to="/app/admin/dashboard"
              className="shrink-0 rounded-lg bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              Acessar →
            </Link>
          </div>
        )}

        {/* Personal info */}
        <div className="rounded-xl border border-border bg-card p-6">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                label="E-mail"
                value={profile?.email ?? ''}
                onChange={() => {}}
                readOnly
                disabled
                className="cursor-not-allowed opacity-60"
              />
              <FormInput
                label="CPF"
                value={profile?.cpf ?? ''}
                onChange={() => {}}
                readOnly
                disabled
                className="cursor-not-allowed opacity-60"
              />
            </div>
            <div className="flex justify-end pt-1">
              {/* TODO: Add loading state and call UserService to persist name and phone changes */}
              <button
                type="submit"
                className="rounded-lg bg-orange px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>

        {/* Companies */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h2 className="text-[16px] font-bold text-text sm:text-[18px]">
              Meus Painéis
            </h2>
            <span className="text-[11px] text-text-muted sm:text-[12px]">
              Empresas e painéis aos quais você tem acesso.
            </span>
          </div>

          {isLoadingCompanies ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="text-orange" />
            </div>
          ) : myCompanies.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8">
              <MdOutlineGridView size={26} className="text-text-muted" />
              <p className="text-[13px] text-text-muted">
                Nenhum painel encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myCompanies.map((company) => (
                <div
                  key={company.companyId}
                  className="flex items-center gap-3.5 rounded-lg border border-border bg-bg px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MdOutlineBusiness size={18} className="text-primary" />
                  </div>
                  <p className="text-[14px] font-semibold text-text">
                    {company.displayName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
