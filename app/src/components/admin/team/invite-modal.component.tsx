import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import AdminService from '@/services/admin.service';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

const FORM_ID = 'invite-admin-form';

interface InviteFormValues {
  email: string;
}

interface InviteAdminModalProps {
  onClose: () => void;
}

export function InviteAdminModal({ onClose }: InviteAdminModalProps) {
  const [isSubmiting, setIsSubmiting] = useState(false);
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>();

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmiting(true);
    try {
      await AdminService.inviteAdmin(values.email);
      await UserService.sendRecoverPasswordEmail(values.email);
      pushSnackbar({
        type: 'success',
        message: `Convite enviado para ${values.email}.`,
      });
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmiting(false);
    }
  };

  return (
    <Modal
      title="Convidar administrador"
      onClose={onClose}
      formId={FORM_ID}
      isSaving={isSubmiting}
      saveLabel="Enviar convite"
      width="max-w-md"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <p className="text-[13px] text-text-sub">
          Um e-mail será enviado para o endereço informado com um link para o
          administrador definir sua senha e criar a conta.
        </p>
        <FormInput
          label="E-mail *"
          type="email"
          placeholder="admin@email.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'E-mail obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido',
            },
          })}
        />
      </form>
    </Modal>
  );
}
