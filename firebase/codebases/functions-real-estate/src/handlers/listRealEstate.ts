import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { RealEstateRepository } from "../repositories/real-estate.repository";

const schema = z.object({ companyId: z.string().min(1) });

/**
 * Lists real-estate listings for a company.
 * Auth: `requireCompanyAccess(req, companyId, "aos imóveis")`.
 * Schema: inline `z.object({ companyId })`.
 */
export const listRealEstateHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "aos imóveis");
  return RealEstateRepository.listByCompany(companyId);
});
