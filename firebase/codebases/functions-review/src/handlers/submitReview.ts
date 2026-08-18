import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, getAuthenticatedUser, auth } from "functions-shared";
import ReviewSchema from "../data/review.schema";
import { ReviewRepository } from "../repositories/review.repository";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Submits a weekly review. Company-users only (not admin/owner) — uses
 * `getAuthenticatedUser` directly instead of `requireAccess`, since
 * `requireAccess`'s `minAccessLevel` is an ordinal floor that would also let
 * higher access levels through.
 */
export const submitReviewHandler = onCallHandler(async (req) => {
  const { uid, accessLevel, companyId } = getAuthenticatedUser(req);

  if (accessLevel !== "user" || !companyId) {
    throw new HttpsError("permission-denied", "Acesso negado!");
  }

  const { success, data, error } = ReviewSchema.submitSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  const targetUser = await auth.getUser(uid);
  const existingClaims = targetUser.customClaims ?? {};
  const lastReviewAt = existingClaims.lastReviewAt as number | undefined;
  const now = Date.now();

  if (lastReviewAt && now - lastReviewAt < SEVEN_DAYS_MS) {
    throw new HttpsError(
      "failed-precondition",
      "Você já avaliou essa semana.",
    );
  }

  await Promise.all([
    ReviewRepository.submit(uid, companyId, data),
    auth.setCustomUserClaims(uid, { ...existingClaims, lastReviewAt: now }),
  ]);
});
