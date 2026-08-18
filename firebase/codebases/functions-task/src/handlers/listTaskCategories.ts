import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import { TaskCategoryRepository } from "../repositories/task-category.repository";

/**
 * Lists task categories.
 * Auth: `getAuthenticatedUser(req)` ONLY — no access-level/permission check at all, just confirms login.
 * Schema: none.
 */
export const listTaskCategoriesHandler = onCallHandler(async (req) => {
  getAuthenticatedUser(req);
  return TaskCategoryRepository.listAll();
});
