import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { OriginRepository } from "../repositories/origin.repository";

const schema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
});

export const saveOriginHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("saveOrigin", { companyId, name: data.name });

  return OriginRepository.save(companyId, data);
});
