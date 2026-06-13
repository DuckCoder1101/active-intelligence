import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdOutlineEmail } from 'react-icons/md';

import { AuthLayout } from '@/components/auth/auth-layout';
import { FormInput } from '@/components/form-input.component';

interface ForgotPasswordFormData {
  email: string;
}

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>();

  async function onSubmit(data: ForgotPasswordFormData) {
    // TODO: call UserService.sendPasswordReset(data.email)
    setSentTo(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-surface">
            <MdOutlineEmail className="text-primary" style={{ fontSize: 26 }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              Verifique seu e-mail
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub">
              Enviamos um link para redefinir sua senha para{' '}
              <span className="font-semibold text-text">{sentTo}</span>.
            </p>
          </div>
          <p className="text-[11px] text-text-muted">
            Não recebeu?{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-primary hover:underline"
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
          disabled={isSubmitting}
          className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
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
