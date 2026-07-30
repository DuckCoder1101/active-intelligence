import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import TaskTagSchema from "../data/task-tag.schema";
import { TaskTagRepository } from "../repositories/task-tag.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

export const saveTaskTagHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = TaskTagSchema.saveSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveTaskTag", { name: data.name });

  return TaskTagRepository.save(data);
});
