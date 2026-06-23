import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from '@/components/ui/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

const FORM_ID = 'invite-user-form';

interface InviteFormValues {
  email: string;
}

interface InviteUserModalProps {
  onClose: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps) {
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
      await UserService.inviteUser(values.email);
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
      title="Convidar usuário"
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
          usuário definir sua senha e criar a conta.
        </p>
        <FormInput
          label="E-mail *"
          type="email"
          placeholder="usuario@email.com"
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
