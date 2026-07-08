import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";

import {onCallHandler} from "functions-shared";
import LeadSchema from "../data/lead.schema";
import {LeadRepository} from "../repositories/lead.repository";
import {requireCompanyAccess} from "../utils/requireCompanyAccess";

export const updateLeadStatusHandler = onCallHandler(async (req) => {
  const {success, data, error} = LeadSchema.updateStatusSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const {companyId} = requireCompanyAccess(req, data.companyId);

  logger.info("updateLeadStatus", {
    companyId,
    leadId: data.leadId,
    status: data.status,
  });

  await LeadRepository.updateStatus(companyId, data.leadId, data.status);
  return true;
});
