import { useMutation } from '@tanstack/react-query';

import type { SubmitReviewDTO } from '@/models/review.model';
import ReviewService from '@/services/review.service';
import { auth } from '@/utils/firebase.util';

export function useSubmitReviewMutation() {
  return useMutation({
    mutationFn: async (dto: SubmitReviewDTO) => {
      await ReviewService.submitReview(dto);
      // Força o refresh do ID token para que `claims.lastReviewAt` já venha
      // atualizado no próximo `onIdTokenChanged` (senão o modal reapareceria
      // até o refresh automático do token).
      await auth.currentUser?.getIdToken(true);
    },
  });
}
