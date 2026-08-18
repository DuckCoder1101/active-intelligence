import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  UserSchema,
  onCallHandler,
  auth,
  getAuthenticatedUser,
  CompanyUserRepository,
  AdminRepository,
} from "functions-shared";

/**
 * Completes a newly invited user's profile: creates the domain record and marks Auth as complete.
 * Auth: `getAuthenticatedUser(req)` (auth-only, no `requireAccess`).
 * Schema: `functions-shared` → `UserSchema.completeProfileSchema`.
 * Calls `auth.updateUser`/`setCustomUserClaims` directly and branches between `CompanyUserRepository`/`AdminRepository` by role.
 */
export const completeProfileHandler = onCallHandler(async (req) => {
  const { uid, email, accessLevel, companyId } = getAuthenticatedUser(req);

  const { success, data, error } = UserSchema.completeProfileSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos ao cadastrar conta!",
      z.treeifyError(error),
    );
  }

  logger.info("completeProfile", { uid, accessLevel, companyId });

  let saveAccountPromise: Promise<void>;

  if (accessLevel === "user") {
    if (!companyId) {
      throw new HttpsError(
        "invalid-argument",
        "Faltando companyId! Contate um administrador!",
      );
    }

    saveAccountPromise = CompanyUserRepository.create(
      uid,
      email,
      companyId,
      data,
    );
  } else {
    saveAccountPromise = AdminRepository.create(uid, email, data);
  }

  await Promise.all([
    saveAccountPromise,

    auth.updateUser(uid, {
      emailVerified: true,
    }),

    auth.setCustomUserClaims(uid, {
      accessLevel,
      companyId,
      complete: true,
    }),
  ]);
});
