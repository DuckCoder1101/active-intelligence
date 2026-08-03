import { httpsCallable } from 'firebase/functions';

import type { SubmitReviewDTO } from '@/models/review.model';
import { functions } from '@/utils/firebase.util';

export default class ReviewService {
  private static submitReviewCallable = httpsCallable<SubmitReviewDTO, void>(
    functions,
    'submitReviewHandler',
  );

  static async submitReview(dto: SubmitReviewDTO): Promise<void> {
    await this.submitReviewCallable(dto);
  }
}
