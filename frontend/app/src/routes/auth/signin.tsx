import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';
import { useSigninMutation } from '@/queries/user.queries';
import { getSessionUser } from '@/server/session';

interface SignInFormData {
  email: string;
  password: string;
}

interface SearchParams {
  companyId?: string;
}

function getRedirectPath(accessLevel?: string, companyId?: string): string {
  if (companyId) {
    return `/company/${companyId}`;
  }

  if (accessLevel === 'user') {
    return '/user/mycompany';
  }

  return '/unauthorized';
}

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
  validateSearch: (search): SearchParams => {
    return {
      companyId: (search.companyId as string) || undefined,
    };
  },
  beforeLoad: async ({ search }) => {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      const to = getRedirectPath(sessionUser.accessLevel, search.companyId);
      throw redirect({ to });
    }
  },
});

function SignInPage() {
  const navigate = useNavigate();
  const { companyId } = Route.useSearch();

  const { claims } = useAuth();
  const signin = useSigninMutation();

  useEffect(() => {
    if (claims) {
      navigate({
        to: getRedirectPath(claims.accessLevel, companyId),
      });
    }
  }, [claims, navigate]);

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
        <p className="text-white text-center text-lg">
          Bem vindo ao seu portal! <br />
          <span className="text-text-muted text-sm">
            Faça login para acessar a sua conta.
          </span>
        </p>

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
