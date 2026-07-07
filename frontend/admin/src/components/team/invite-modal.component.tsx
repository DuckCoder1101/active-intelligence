import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { useInviteAdminMutation } from '@/queries/admin.queries';

const FORM_ID = 'invite-admin-form';

interface InviteFormValues {
  email: string;
}

interface InviteAdminModalProps {
  onClose: () => void;
}

export function InviteAdminModal({ onClose }: InviteAdminModalProps) {
  const inviteAdmin = useInviteAdminMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>();

  const onSubmit = (values: InviteFormValues) => {
    inviteAdmin.mutate(values.email, {
      onSuccess: () => {
        toast.success(`Convite enviado para ${values.email}.`);
        onClose();
      },
    });
  };

  return (
    <Modal
      title="Convidar administrador"
      onClose={onClose}
      formId={FORM_ID}
      isSaving={inviteAdmin.isPending}
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
