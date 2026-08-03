import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { CrmFunnelRepository } from "../repositories/crm-funnel.repository";

const schema = z.object({
  companyId: z.string().min(1),
  funnelId: z.string().optional(),
  name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
  order: z.number().optional(),
});

/**
 * Creates/updates a CRM funnel.
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: inline `z.object({companyId, funnelId?, name, order?})`.
 */
export const saveCrmFunnelHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("saveCrmFunnel", {
    companyId,
    action: data.funnelId ? "update" : "create",
    funnelId: data.funnelId,
  });

  return CrmFunnelRepository.save(companyId, data);
});
