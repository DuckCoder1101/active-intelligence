import { useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useAuth } from '@/contexts/auth.context';
import { getSessionUser } from '@/server/session';

interface SignInFormData {
  email: string;
  password: string;
}

function getRedirectPath(accessLevel?: string): string {
  if (accessLevel === 'user') return '/user/mycompany';
  return '/admin/dashboard';
}

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      const to = getRedirectPath(
        (sessionUser as { accessLevel?: string }).accessLevel,
      );
      throw redirect({ to });
    }
  },
});

function SignInPage() {
  const handleError = useHandleError();
  const navigate = useNavigate();
  const { claims } = useAuth();

  useEffect(() => {
    if (claims) {
      navigate({ to: getRedirectPath(claims.accessLevel) });
    }
  }, [claims, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>();

  async function onSubmit(data: SignInFormData) {
    try {
      await UserService.signin(data.email, data.password);
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        (error.code === 'auth/invalid-credential' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/user-not-found')
      ) {
        setError('email', { message: ' ' });
        setError('password', { message: 'E-mail ou senha incorretos.' });
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

        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Senha"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Senha obrigatória',
            })}
          />
          <div className="text-right">
            <Link
              to="/auth/forgot-password"
              className="text-[11px] text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <button type="submit" className="btn-auth">
          {!isSubmitting ? (
            <>Entrar</>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={16} />
              Entrando...
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
