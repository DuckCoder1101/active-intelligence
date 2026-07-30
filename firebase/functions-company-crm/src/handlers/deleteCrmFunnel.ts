import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { CrmFunnelRepository } from "../repositories/crm-funnel.repository";

const schema = z.object({
  companyId: z.string().min(1),
  funnelId: z.string().min(1),
});

export const deleteCrmFunnelHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "funnelId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("deleteCrmFunnel", { companyId, funnelId: data.funnelId });

  return CrmFunnelRepository.delete(companyId, data.funnelId);
});
