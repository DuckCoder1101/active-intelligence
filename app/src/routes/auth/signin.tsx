import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { FaGoogle } from 'react-icons/fa';

import { AuthLayout } from '@components/auth/auth-layout';
import { FormInput } from '@components/form-input.component';
import { PasswordInput } from '@components/password-input.component';
import { Spinner } from '@components/spinner.component';
import UserService from '@services/user.service';
import { FirebaseError } from 'firebase/app';

import { useHandleError } from '@utils/handleError';

interface SignInFormData {
  email: string;
  password: string;
}

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});

function SignInPage() {
  const handleError = useHandleError();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>();

  async function onSubmit(data: SignInFormData) {
    try {
      await UserService.signinWithCredentials(data.email, data.password);
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        (error.code === 'auth/invalid-credential' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/user-c-found')
      ) {
        setError('email', { message: ' ' });
        setError('password', { message: 'E-mail ou senha incorretos.' });
      } else {
        handleError(error);
      }
    }
  }

  async function onGoogleSignIn() {
    setIsGoogleLoading(true);

    try {
      await UserService.signinWithGoogle();
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request')
      ) {
        return;
      }
      handleError(error);
    } finally {
      setIsGoogleLoading(false);
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

        <button
          type="submit"
          disabled={isGoogleLoading}
          className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
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

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-text-muted">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isGoogleLoading || isSubmitting}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg disabled:opacity-60"
      >
        {!isGoogleLoading ? (
          <>
            <FaGoogle />
            Entrar com Google
          </>
        ) : (
          <>
            <Spinner size={16} />
            Entrando...
          </>
        )}
      </button>

      <p className="mt-5 text-center text-[11px] text-text-muted">
        Não tem uma conta?
        <Link
          to="/auth/signup"
          className="font-semibold text-primary hover:underline ml-2"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
