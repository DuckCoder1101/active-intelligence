import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const schema = z.object({
  companyId: z.string().min(1),
  guideId: z.string().min(1),
});

/**
 * Gets a single guide assigned to a company.
 * Auth: `requireCompanyAccess(req, companyId, "à Biblioteca")`.
 * Schema: inline `z.object({ companyId, guideId })`.
 */
export const getAssignedGuideHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId e guideId obrigatórios");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "à Biblioteca");
  return GuideRepository.getForCompany(companyId, data.guideId);
});
