import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdOutlineCheckCircle, MdOutlineErrorOutline } from 'react-icons/md';

import { AuthLayout } from '@/components/auth/auth-layout.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  useConfirmPasswordResetMutation,
  useVerifyPasswordResetCodeMutation,
} from '@/queries/user.queries';

interface SearchParams {
  oobCode?: string;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search): SearchParams => {
    return {
      oobCode: (search.oobCode as string) || undefined,
    };
  },
});

function ResetPasswordPage() {
  const { oobCode } = Route.useSearch();
  const [done, setDone] = useState(false);

  const verifyCode = useVerifyPasswordResetCodeMutation();
  const confirmReset = useConfirmPasswordResetMutation();

  useEffect(() => {
    if (oobCode) {
      verifyCode.mutate(oobCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  async function onSubmit(data: ResetPasswordFormData) {
    if (!oobCode) {
      return;
    }
    await confirmReset.mutateAsync({ oobCode, password: data.password });
    setDone(true);
  }

  if (!oobCode || verifyCode.isError) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-surface">
            <MdOutlineErrorOutline className="text-danger" size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              Link inválido ou expirado
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub">
              Solicite um novo link de redefinição de senha.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-center">
          <Link
            to="/auth/forgot-password"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            ← Solicitar novo link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (verifyCode.isPending || verifyCode.isIdle) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-6">
          <Spinner size={24} />
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-surface">
            <MdOutlineCheckCircle className="text-primary" size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Senha redefinida</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub">
              Sua senha foi alterada com sucesso.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-center">
          <Link
            to="/auth/signin"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            ← Ir para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="mb-5 text-center text-[12px] leading-relaxed text-text-sub">
        Crie uma nova senha para <strong>{verifyCode.data}</strong>.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <PasswordInput
          label="Nova senha"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Senha obrigatória',
            minLength: { value: 6, message: 'Mínimo de 6 caracteres' },
          })}
        />

        <PasswordInput
          label="Confirmar senha"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Confirmação obrigatória',
            validate: (value) =>
              value === getValues('password') || 'As senhas não coincidem',
          })}
        />

        <button
          type="submit"
          disabled={confirmReset.isPending}
          className="btn-auth"
        >
          {!confirmReset.isPending ? (
            <>Redefinir senha</>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={16} />
              Redefinindo...
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
