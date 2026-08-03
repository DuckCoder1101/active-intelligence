export interface ReviewDTO {
  reviewId: string;
  companyName: string;
  submitterName?: string;
  anonymous: boolean;
  stars: number;
  comment?: string;
  createdAt: number;
}

export interface SubmitReviewDTO {
  stars: number;
  comment?: string;
  anonymous: boolean;
}
