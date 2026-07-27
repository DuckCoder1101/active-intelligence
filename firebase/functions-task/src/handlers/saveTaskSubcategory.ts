import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import TaskCategorySchema from "../data/task-category.schema";
import { TaskCategoryRepository } from "../repositories/task-category.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

export const saveTaskSubcategoryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } =
    TaskCategorySchema.saveSubcategorySchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveTaskSubcategory", {
    action: data.subcategoryId ? "update" : "create",
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId,
  });

  return TaskCategoryRepository.saveSubcategory(data);
});
