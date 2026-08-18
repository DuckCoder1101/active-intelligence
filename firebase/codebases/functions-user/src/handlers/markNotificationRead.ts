import { z } from "zod";
import { HttpsError } from "firebase-functions/https";

import {
  onCallHandler,
  requireAccess,
  NotificationRepository,
} from "functions-shared";
import NotificationSchema from "../data/notification.schema";

const ACCESS = { minAccessLevel: "user" as const };

/**
 * Marks a notification as read.
 * Auth: `requireAccess(req, {minAccessLevel:"user"})`.
 * Schema: `../data/notification.schema` → `NotificationSchema.markReadSchema`.
 */
export const markNotificationReadHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } =
    NotificationSchema.markReadSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  await NotificationRepository.markRead(caller.uid, data.notificationId);

  return true;
});
