import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler } from "functions-shared";
import LeadSchema from "../data/lead.schema";
import { LeadRepository } from "../repositories/lead.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

export const updateLeadDealStatusHandler = onCallHandler(async (req) => {
  const { success, data, error } = LeadSchema.updateDealStatusSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("updateLeadDealStatus", {
    companyId,
    leadId: data.leadId,
    dealStatus: data.dealStatus,
  });

  await LeadRepository.updateDealStatus(companyId, data.leadId, data.dealStatus);
  return true;
});
