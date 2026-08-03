import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { SubcategoryRepository } from "../repositories/subcategory.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  subcategoryId: z.string().min(1, "subcategoryId obrigatório"),
});

/**
 * Deletes a finance subcategory.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: inline z.object({subcategoryId}).
 */
export const deleteSubcategoryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("deleteSubcategory", { subcategoryId: data.subcategoryId });

  await SubcategoryRepository.delete(data.subcategoryId);
});
