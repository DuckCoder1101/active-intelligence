import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler } from "functions-shared";
import { CrmFunnelRepository } from "../repositories/crm-funnel.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

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

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("deleteCrmFunnel", { companyId, funnelId: data.funnelId });

  return CrmFunnelRepository.delete(companyId, data.funnelId);
});
