import { useEffect } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { FunctionsError, httpsCallable } from 'firebase/functions';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';

import { auth, functions } from '@/utils/firebase.util';

import { loadFielErrors } from '@/utils/loadFieldErrors.util';

import { useAuth } from '@/contexts/auth.context';

import { useHandleError } from '@/hooks/useHandleError.util';

import { getSessionUser } from '@/server/session';
import type { CompleteAccountDTO } from '@/types/dtos/user.dto';

const completeProfileCallable = httpsCallable<CompleteAccountDTO, void>(
  functions,
  'completeProfileHandler',
);

function getRedirectPath(accessLevel?: string): string {
  if (accessLevel === 'user') return '/user/mycompany';
  return '/admin/dashboard';
}

export const Route = createFileRoute('/auth/complete-account')({
  component: SignUpPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) throw redirect({ to: '/auth/signin' });
    return { sessionUser };
  },
});

function SignUpPage() {
  const handleError = useHandleError();
  const navigate = useNavigate();

  const { claims, userProfile: profile, isLoadingProfile } = useAuth();

  useEffect(() => {
    if (!isLoadingProfile && claims && profile) {
      navigate({ to: getRedirectPath(claims.accessLevel) });
    }
  }, [claims, profile, isLoadingProfile, navigate]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CompleteAccountDTO>();

  const onSubmit = async (data: CompleteAccountDTO) => {
    try {
      await completeProfileCallable(data);
      await auth.currentUser?.getIdToken(true);
    } catch (error) {
      if (error instanceof FunctionsError && error.details) {
        loadFielErrors(error.details, setError);
      } else {
        handleError(error);
      }
    }
  };

  if (!claims) return null;

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormInput
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Nome obrigatório',
            minLength: { value: 2, message: 'Nome muito curto' },
          })}
        />

        <Controller
          name="cpf"
          control={control}
          rules={{ required: 'CPF obrigatório' }}
          render={({ field }) => (
            <FormInput
              as={IMaskInput}
              mask="000.000.000-00"
              label="CPF"
              type="tel"
              placeholder="000.000.000-00"
              error={errors.cpf?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <FormInput
              as={IMaskInput}
              mask="(00) 00000-0000"
              label="Celular"
              type="tel"
              placeholder="(00) 00000-0000"
              error={errors.phone?.message}
              {...field}
            />
          )}
        />

        <button type="submit" disabled={isSubmitting} className="btn-auth">
          {!isSubmitting ? (
            <>Concluir cadastro</>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={16} />
              Registrando informações...
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
