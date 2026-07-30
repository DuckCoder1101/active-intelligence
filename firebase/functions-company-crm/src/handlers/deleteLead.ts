import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { LeadRepository } from "../repositories/lead.repository";

const schema = z.object({
  companyId: z.string().min(1),
  leadId: z.string().min(1),
});

export const deleteLeadHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "leadId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("deleteLead", { companyId, leadId: data.leadId });

  await LeadRepository.delete(companyId, data.leadId);
  return true;
});
