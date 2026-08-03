import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, CompanyUserRepository, requireCompanyAccess } from "functions-shared";

const schema = z.object({ companyId: z.string().min(1) });

/**
 * Lists a company's users (for CRM assignment).
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: inline `z.object({companyId})`.
 */
export const listMyCompanyUsersHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");
  return CompanyUserRepository.listByCompany(companyId);
});
