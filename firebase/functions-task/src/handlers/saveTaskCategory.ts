import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import TaskCategorySchema from "../data/task-category.schema";
import { TaskCategoryRepository } from "../repositories/task-category.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

/**
 * Creates/updates a task category.
 * Auth: `requireAccess(req, {minAccessLevel:"admin", permissions:["manage-settings"]})`.
 * Schema: `../data/task-category.schema` → `TaskCategorySchema.saveCategorySchema`.
 */
export const saveTaskCategoryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } =
    TaskCategorySchema.saveCategorySchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveTaskCategory", {
    action: data.categoryId ? "update" : "create",
    categoryId: data.categoryId,
  });

  return TaskCategoryRepository.saveCategory(data);
});
