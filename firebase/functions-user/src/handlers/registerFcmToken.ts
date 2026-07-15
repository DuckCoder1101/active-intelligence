import {z} from "zod";
import {HttpsError} from "firebase-functions/https";

import {
  onCallHandler,
  requireAccess,
  AdminRepository,
  CompanyUserRepository,
} from "functions-shared";
import NotificationSchema from "../data/notification.schema";

const ACCESS = {minAccessLevel: "user" as const};

export const registerFcmTokenHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const {success, data, error} =
    NotificationSchema.registerFcmTokenSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  if (caller.accessLevel === "user") {
    await CompanyUserRepository.addFcmToken(caller.uid, data.token);
  } else {
    await AdminRepository.addFcmToken(caller.uid, data.token);
  }

  return true;
});
