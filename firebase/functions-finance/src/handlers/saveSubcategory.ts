import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { FINANCE_CATEGORY_TYPES } from "../types/category.type";
import { SubcategoryRepository } from "../repositories/subcategory.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  subcategoryId: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  categoryType: z.enum(FINANCE_CATEGORY_TYPES, { message: "Categoria inválida" }),
  name: z
    .string()
    .trim()
    .min(1, "Nome obrigatório")
    .max(60, "Máximo 60 caracteres"),
  order: z.number().nullish().transform((v) => v ?? undefined),
});

export const saveSubcategoryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveSubcategory", {
    action: data.subcategoryId ? "update" : "create",
    subcategoryId: data.subcategoryId,
  });

  return SubcategoryRepository.save(data);
});
