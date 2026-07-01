import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdOutlineEmail } from 'react-icons/md';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { FormInput } from '@/components/ui/form-input.component';
import { useSendPasswordResetMutation } from '@/queries/user.queries';
import { getSessionUser } from '@/server/session';

interface ForgotPasswordFormData {
  email: string;
}

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      throw redirect({ to: '/user/profile' });
    }
  },
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [enableResent, setEnableResent] = useState(false);

  const [email, setEmail] = useState('');

  const sendPasswordReset = useSendPasswordResetMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  function onSubmit(data: ForgotPasswordFormData) {
    sendPasswordReset.mutate(data.email, {
      onSettled: () => {
        setEmail(data.email);
        setEnableResent(false);
        setSent(true);
      },
    });
  }

  // Cooldown
  useEffect(() => {
    if (!sent) {
      return;
    }

    const timeout = setTimeout(() => setEnableResent(true), 30 * 1000);
    return () => clearTimeout(timeout);
  }, [sent]);

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-surface">
            <MdOutlineEmail className="text-primary" size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              Verifique seu e-mail
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub">
              Enviamos um link para redefinir sua senha para{' '}
              <span className="font-semibold text-text">{email}</span>.
            </p>
          </div>
          <p className="text-[11px] text-text-muted">
            Não recebeu?{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-primary hover:underline disabled:text-text-muted"
              disabled={!enableResent}
            >
              Reenviar
            </button>
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-center">
          <Link
            to="/auth/signin"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            ← Voltar ao login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="mb-5 text-center text-[12px] leading-relaxed text-text-sub">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

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

        <button
          type="submit"
          disabled={sendPasswordReset.isPending}
          className="btn-auth"
        >
          {sendPasswordReset.isPending
            ? 'Enviando...'
            : 'Enviar link de redefinição'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          to="/auth/signin"
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          ← Voltar ao login
        </Link>
      </div>
    </AuthLayout>
  );
}
