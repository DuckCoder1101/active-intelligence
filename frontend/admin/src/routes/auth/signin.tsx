import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { signOut } from 'firebase/auth';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';
import { useSigninMutation } from '@/queries/user.queries';
import { getSessionUser } from '@/server/session';
import { auth } from '@/utils/firebase.util';

interface SignInFormData {
  email: string;
  password: string;
}

const APP_SIGNIN_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/auth/signin`
  : undefined;

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return;
    }

    if (sessionUser.accessLevel === 'user') {
      throw redirect({ href: APP_SIGNIN_URL ?? '/unauthorized' });
    }

    throw redirect({ to: '/' });
  },
});

function SignInPage() {
  const { claims } = useAuth();
  const signin = useSigninMutation();

  useEffect(() => {
    if (!claims) {
      return;
    }

    let cancelled = false;

    (async () => {
      // Confirma a sessão no servidor antes do window.location.href: se o
      // guard de "/" não reconhece o cookie, ele devolve para cá e cada
      // volta do ciclo é um reload de página inteira — infinito. Nesse caso
      // o usuário persistido no SDK é lixo (ex.: emulator reiniciado) —
      // derruba para realinhar cliente e servidor.
      const sessionUser = await getSessionUser();
      if (cancelled) {
        return;
      }

      if (!sessionUser) {
        await signOut(auth);
        return;
      }

      if (sessionUser.accessLevel === 'user') {
        window.location.href = APP_SIGNIN_URL ?? '/unauthorized';
        return;
      }

      window.location.href = '/';
    })();

    return () => {
      cancelled = true;
    };
  }, [claims]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormData>();

  async function onSubmit(data: SignInFormData) {
    const result = await signin.mutateAsync(data);
    if (result.invalidCredentials) {
      setError('email', { message: ' ' });
      setError('password', { message: 'E-mail ou senha incorretos.' });
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
          {!signin.isPending ? (
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
