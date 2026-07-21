import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  nextGuideSequenceQueryOptions,
  useSaveGuideMutation,
} from '@/queries/library.queries';

const FORM_ID = 'create-guide-form';

interface CreateGuideFormValues {
  name?: string;
}

interface CreateGuideModalProps {
  onClose: () => void;
}

export function CreateGuideModal({ onClose }: CreateGuideModalProps) {
  const navigate = useNavigate();
  const saveGuide = useSaveGuideMutation();
  const { register, handleSubmit } = useForm<CreateGuideFormValues>();

  // Reflete o contador real salvo no banco (library/hub.guideSequence),
  // não uma estimativa a partir dos guias já carregados na lista.
  const { data: nextSequence } = useQuery(nextGuideSequenceQueryOptions());
  const prefix = nextSequence
    ? `G-${String(nextSequence).padStart(3, '0')}-`
    : '';

  const onSubmit = (values: CreateGuideFormValues) => {
    saveGuide.mutate(
      { name: values.name },
      {
        onSuccess: (guide) => {
          toast.success('Guia criado!');
          navigate({
            to: '/library/$guideId',
            params: { guideId: guide.guideId },
          });
        },
      },
    );
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} className="btn-ghost">
        Cancelar
      </button>
      <button
        form={FORM_ID}
        type="submit"
        disabled={saveGuide.isPending}
        className="btn-primary"
      >
        {saveGuide.isPending && <Spinner size={12} />}
        Criar
      </button>
    </div>
  );

  return (
    <Modal title="Novo guia de conteúdo" onClose={onClose} footer={footer}>
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Nome (opcional)"
          placeholder="Ex: Bastidores de obra"
          leftSlot={
            prefix && (
              <span className="text-[13px] text-text-muted">{prefix}</span>
            )
          }
          {...register('name')}
        />
      </form>
    </Modal>
  );
}
