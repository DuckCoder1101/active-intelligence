import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {z} from "zod";

import {onCallHandler, requireAccess} from "functions-shared";
import {CategoryRepository} from "../repositories/category.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome obrigatório")
    .max(60, "Máximo 60 caracteres"),
});

export const saveCategoryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveCategory", {name: data.name});

  return CategoryRepository.save(data.name);
});
