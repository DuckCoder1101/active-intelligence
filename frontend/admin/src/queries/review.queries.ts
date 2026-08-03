import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import ReviewService from '@/services/review.service';

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
};

export const reviewsQueryOptions = () =>
  queryOptions({
    queryKey: reviewKeys.lists(),
    queryFn: () => ReviewService.listReviews(),
  });

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => ReviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
