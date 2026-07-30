import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { OriginRepository } from "../repositories/origin.repository";

const schema = z.object({
  companyId: z.string().min(1),
  originId: z.string().min(1),
});

export const deleteOriginHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "originId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("deleteOrigin", { companyId, originId: data.originId });

  await OriginRepository.delete(companyId, data.originId);
  return true;
});
