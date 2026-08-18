import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PhoneInput } from '@/components/ui/phone-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';
import { useCompleteAccountMutation } from '@/queries/user.queries';
import { getSessionUser } from '@/server/session';
import type { CompleteAccountDTO } from '@/types/dtos/user.dto';
import { loadFielErrors } from '@/utils/loadFieldErrors.util';

function getRedirectPath(accessLevel?: string): string {
  if (accessLevel === 'user') {
    return '/user/mycompany';
  }
  return '/';
}

export const Route = createFileRoute('/auth/complete-account')({
  component: SignUpPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      throw redirect({ to: '/auth/signin' });
    }
    return { sessionUser };
  },
});

function SignUpPage() {
  const navigate = useNavigate();
  const completeAccount = useCompleteAccountMutation();

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
    formState: { errors },
    setError,
  } = useForm<CompleteAccountDTO>();

  const onSubmit = async (data: CompleteAccountDTO) => {
    const result = await completeAccount.mutateAsync(data);
    if (result.fieldErrors) {
      loadFielErrors(result.fieldErrors, setError);
    }
  };

  if (!claims) {
    return null;
  }

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
            minLength: {
              value: 2,
              message: 'Nome muito curto',
            },
          })}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput label="Celular" error={errors.phone?.message} {...field} />
          )}
        />

        <button
          type="submit"
          disabled={completeAccount.isPending}
          className="btn-auth"
        >
          {!completeAccount.isPending ? (
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
