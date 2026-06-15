import { useEffect } from 'react';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { FunctionsError } from 'firebase/functions';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import UserService from '@services/user.service';
import { loadFielErrors } from '@/utils/loadFieldErrors.util';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useAuth } from '@/contexts/auth.context';
import { getSessionUser } from '@/server/session';

interface SignUpFormData {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
}

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (sessionUser) throw redirect({ to: '/app/user/profile' });
  },
});

function SignUpPage() {
  const handleError = useHandleError();
  const navigate = useNavigate();
  const { authUser, isSessionReady } = useAuth();

  useEffect(() => {
    if (isSessionReady && authUser) {
      navigate({ to: '/app/user/profile' });
    }
  }, [authUser, isSessionReady, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>();

  const password = watch('password');

  async function onSubmit(data: SignUpFormData) {
    try {
      await UserService.registerAccount(data);
    } catch (error) {
      if (error instanceof FunctionsError && error.details) {
        loadFielErrors(error.details, setError);
      } else {
        handleError(error);
      }
    }
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
            minLength: { value: 2, message: 'Nome muito curto' },
          })}
        />

        <FormInput
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'E-mail obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido',
            },
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

        <PasswordInput
          label="Senha"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Senha obrigatória',
            minLength: { value: 8, message: 'Mínimo de 8 caracteres' },
          })}
        />

        <PasswordInput
          label="Confirmar senha"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Confirme sua senha',
            validate: (value) =>
              value === password || 'As senhas não coincidem',
          })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {!isSubmitting ? (
            <>Cadastrar-se</>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={16} />
              Criando conta...
            </span>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] text-text-muted">
        Já tem uma conta?{' '}
        <Link
          to="/auth/signin"
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
