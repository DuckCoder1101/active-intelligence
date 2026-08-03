import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { CrmColumnRepository } from "../repositories/crm-column.repository";

const schema = z.object({
  companyId: z.string().min(1),
  funnelId: z.string().min(1),
  columnId: z.string().min(1),
});

/**
 * Deletes a CRM kanban column.
 * Auth: `requireCompanyAccess(req, data.companyId, "ao CRM")`.
 * Schema: inline `z.object({companyId, funnelId, columnId})`.
 */
export const deleteCrmColumnHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "funnelId e columnId obrigatórios",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("deleteCrmColumn", {
    companyId,
    funnelId: data.funnelId,
    columnId: data.columnId,
  });

  return CrmColumnRepository.delete(companyId, data.funnelId, data.columnId);
});
