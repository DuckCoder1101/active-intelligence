import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import LeadSchema from "../data/lead.schema";
import { LeadRepository } from "../repositories/lead.repository";

/**
 * Updates a lead's pipeline/column status.
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: `../data/lead.schema` → `LeadSchema.updateStatusSchema`.
 */
export const updateLeadStatusHandler = onCallHandler(async (req) => {
  const { success, data, error } = LeadSchema.updateStatusSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("updateLeadStatus", {
    companyId,
    leadId: data.leadId,
    status: data.status,
  });

  await LeadRepository.updateStatus(companyId, data.leadId, data.status);
  return true;
});
