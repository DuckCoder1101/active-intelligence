import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler } from "functions-shared";
import { CrmFunnelRepository } from "../repositories/crm-funnel.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({
  companyId: z.string().min(1),
  funnelId: z.string().optional(),
  name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
  order: z.number().optional(),
});

export const saveCrmFunnelHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("saveCrmFunnel", {
    companyId,
    action: data.funnelId ? "update" : "create",
    funnelId: data.funnelId,
  });

  return CrmFunnelRepository.save(companyId, data);
});
