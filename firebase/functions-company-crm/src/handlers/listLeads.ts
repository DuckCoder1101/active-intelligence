import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { LeadRepository } from "../repositories/lead.repository";

const schema = z.object({ companyId: z.string().min(1) });

/**
 * Lists leads for a company.
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: inline `z.object({companyId})`.
 */
export const listLeadsHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");
  return LeadRepository.listByCompany(companyId);
});
