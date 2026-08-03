import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Modal } from '@/components/layout/modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import { FormInput } from '@/components/ui/form-input.component';
import { StarRating } from '@/components/reviews/star-rating.component';
import { useSubmitReviewMutation } from '@/queries/review.queries';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

interface ReviewFormValues {
  comment: string;
  anonymous: boolean;
}

export function ReviewRequiredModal() {
  const [stars, setStars] = useState(0);
  const { register, handleSubmit } = useForm<ReviewFormValues>({
    defaultValues: { comment: '', anonymous: false },
  });
  const { mutate, isPending } = useSubmitReviewMutation();

  const onSubmit = handleSubmit((values) => {
    if (stars === 0) {return;}

    mutate(
      {
        stars,
        comment: values.comment.trim() || undefined,
        anonymous: values.anonymous,
      },
      {
        onError: (err) => toast.error(mapFirebaseError(err)),
      },
    );
  });

  return (
    <Modal
      title="Avalie sua experiência"
      onClose={() => {}}
      dismissable={false}
      footer={
        <div className="flex justify-end">
          <button
            type="submit"
            form="review-required-form"
            disabled={stars === 0 || isPending}
            className="btn-primary"
          >
            {isPending && <Spinner size={12} />}
            Enviar avaliação
          </button>
        </div>
      }
    >
      <form
        id="review-required-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-[13px] text-text-sub">
            Como você avalia sua experiência esta semana?
          </p>
          <StarRating value={stars} onChange={setStars} />
        </div>

        <FormInput
          as="textarea"
          rows={3}
          label="Comentário (opcional)"
          placeholder="Conte um pouco mais..."
          {...register('comment')}
        />

        <label className="flex items-center gap-2 text-[12.5px] text-text-sub">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-orange"
            {...register('anonymous')}
          />
          Enviar avaliação anônima
        </label>
      </form>
    </Modal>
  );
}
