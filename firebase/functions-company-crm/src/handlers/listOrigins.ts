import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { OriginRepository } from "../repositories/origin.repository";

const schema = z.object({ companyId: z.string().min(1) });

/**
 * Lists lead origins for a company.
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: inline `z.object({companyId})`.
 */
export const listOriginsHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");
  return OriginRepository.listAll(companyId);
});
