import { httpsCallable } from 'firebase/functions';

import type { Review } from '@/models/review.model';
import { functions } from '@/utils/firebase.util';

export default class ReviewService {
  private static listReviewsCallable = httpsCallable<void, Review[]>(
    functions,
    'listReviewsHandler',
  );

  private static deleteReviewCallable = httpsCallable<
    { reviewId: string },
    void
  >(functions, 'deleteReviewHandler');

  static async listReviews(): Promise<Review[]> {
    const r = await this.listReviewsCallable();
    return r.data;
  }

  static async deleteReview(reviewId: string): Promise<void> {
    await this.deleteReviewCallable({ reviewId });
  }
}
