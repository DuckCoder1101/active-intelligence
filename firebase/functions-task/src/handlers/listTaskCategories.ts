import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import { TaskCategoryRepository } from "../repositories/task-category.repository";

export const listTaskCategoriesHandler = onCallHandler(async (req) => {
  getAuthenticatedUser(req);
  return TaskCategoryRepository.listAll();
});
