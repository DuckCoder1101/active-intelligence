import { onCallHandler, requireAccess } from "functions-shared";
import { SubcategoryRepository } from "../repositories/subcategory.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

export const listSubcategoriesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return SubcategoryRepository.listAll();
});
