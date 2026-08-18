import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  getAuthenticatedUser,
  UserSchema,
  auth,
  bucket,
  database,
  AdminRepository,
  CompanyUserRepository,
  NotificationRepository,
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

  await Promise.all([
    bucket
      .file(`users/${data.targetId}/avatar`)
      .delete()
      .catch((err) =>
        logger.warn("deleteAccount: falha ao deletar avatar", {
          targetUid: data.targetId,
          err: String(err),
        }),
      ),
    NotificationRepository.removeUidFromAll(data.targetId).catch((err) =>
      logger.warn("deleteAccount: falha ao limpar notificações", {
        targetUid: data.targetId,
        err: String(err),
      }),
    ),
    unassignFromTasks(data.targetId).catch((err) =>
      logger.warn("deleteAccount: falha ao limpar assignedTo em tasks", {
        targetUid: data.targetId,
        err: String(err),
      }),
    ),
  ]);
});

/**
 * `tasks` is owned by `functions-task` (a separate deploy unit that this
 * codebase doesn't vendor), so this touches the collection directly via the
 * shared Firestore instance instead of importing a `TaskRepository`.
 */
async function unassignFromTasks(uid: string): Promise<void> {
  const tasksCollection = database.collection("tasks");

  for (;;) {
    const snap = await tasksCollection
      .where("assignedTo", "array-contains", uid)
      .limit(500)
      .get();
    if (snap.empty) return;

    const batch = database.batch();
    snap.docs.forEach((doc) =>
      batch.update(doc.ref, { assignedTo: FieldValue.arrayRemove(uid) }),
    );
    await batch.commit();

    if (snap.size < 500) return;
  }
}
