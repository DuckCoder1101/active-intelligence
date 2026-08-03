import { z } from "zod";
import { HttpsError } from "firebase-functions/https";

import {
  onCallHandler,
  requireAccess,
  AdminRepository,
  CompanyUserRepository,
} from "functions-shared";
import NotificationSchema from "../data/notification.schema";

const ACCESS = { minAccessLevel: "user" as const };

/**
 * Removes a device FCM push token for the caller.
 * Auth: `requireAccess(req, {minAccessLevel:"user"})`.
 * Schema: reuses `NotificationSchema.registerFcmTokenSchema` (no separate unregister schema — intentional reuse).
 * Branches repository by the caller's accessLevel.
 */
export const unregisterFcmTokenHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } =
    NotificationSchema.registerFcmTokenSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  if (caller.accessLevel === "user") {
    await CompanyUserRepository.removeFcmToken(caller.uid, data.token);
  } else {
    await AdminRepository.removeFcmToken(caller.uid, data.token);
  }

  return true;
});
