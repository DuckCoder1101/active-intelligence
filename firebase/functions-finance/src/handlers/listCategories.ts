import {onCallHandler, requireAccess} from "functions-shared";
import {CategoryRepository} from "../repositories/category.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

export const listCategoriesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return CategoryRepository.listAll();
});
