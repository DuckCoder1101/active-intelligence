import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {z} from "zod";

import {onCallHandler, requireAccess} from "functions-shared";
import {AccountRepository} from "../repositories/account.repository";

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

export const saveAccountHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveAccount", {name: data.name});

  return AccountRepository.save(data.name);
});
