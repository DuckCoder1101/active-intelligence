import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  getAuthenticatedUser,
  UserSchema,
  auth,
  bucket,
  AdminRepository,
  CompanyUserRepository,
  UserAccessLevel,
} from "functions-shared";

/**
 * Deletes a user's own account, or (if caller is owner) another user's account — including the Auth record and avatar file.
 * Auth: `getAuthenticatedUser(req)` + manual check `targetId !== uid && accessLevel !== "owner"`.
 * Schema: `functions-shared` → `UserSchema.deleteAccountSchema`.
 * Calls `auth.deleteUser` and `bucket.file(...).delete()` directly; branches repository by the target's access level.
 */
export const deleteAccountHandler = onCallHandler(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);

  const { data, success, error } = UserSchema.deleteAccountSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos ao deletar conta!",
      z.treeifyError(error),
    );
  }

  if (data.targetId !== uid && accessLevel !== "owner") {
    throw new HttpsError(
      "permission-denied",
      "Você não tem permissão para deletar a conta de outro usuário.",
    );
  }

  logger.info("deleteAccount", {
    targetUid: data.targetId,
    callerUid: uid,
  });

  const targetUser = await auth.getUser(data.targetId);
  const targetAccessLevel = targetUser.customClaims?.["accessLevel"] as
    | UserAccessLevel
    | undefined;

  const deleteAccountPromise =
    targetAccessLevel === "user" ?
      CompanyUserRepository.delete(data.targetId) :
      AdminRepository.delete(data.targetId);

  await Promise.all([auth.deleteUser(data.targetId), deleteAccountPromise]);

  await bucket
    .file(`users/${data.targetId}/avatar`)
    .delete()
    .catch((err) =>
      logger.warn("deleteAccount: falha ao deletar avatar", {
        targetUid: data.targetId,
        err: String(err),
      }),
    );
});
