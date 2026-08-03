import { onCallHandler, requireAccess } from "functions-shared";
import { ReviewRepository } from "../repositories/review.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-reviews" as const],
};

/**
 * Lists all reviews (admin only).
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-reviews"]}).
 */
export const listReviewsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return ReviewRepository.list();
});
