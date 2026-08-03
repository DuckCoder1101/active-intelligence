import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import TaskTagSchema from "../data/task-tag.schema";
import { TaskTagRepository } from "../repositories/task-tag.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

/**
 * Deletes a task tag.
 * Auth: `requireAccess(req, {minAccessLevel:"admin", permissions:["manage-settings"]})`.
 * Schema: `../data/task-tag.schema` → `TaskTagSchema.deleteSchema`.
 */
export const deleteTaskTagHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = TaskTagSchema.deleteSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("deleteTaskTag", { tagId: data.tagId });

  await TaskTagRepository.delete(data.tagId);

  return true;
});
