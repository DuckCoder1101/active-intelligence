import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import ReviewSchema from "../data/review.schema";
import { ReviewRepository } from "../repositories/review.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-reviews" as const],
};

/**
 * Deletes a review (admin only).
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-reviews"]}).
 */
export const deleteReviewHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = ReviewSchema.deleteSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  await ReviewRepository.delete(data.reviewId);
});
