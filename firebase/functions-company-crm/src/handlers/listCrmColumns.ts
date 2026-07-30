import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { CrmColumnRepository } from "../repositories/crm-column.repository";

const schema = z.object({
  companyId: z.string().min(1),
  funnelId: z.string().min(1),
});

export const listCrmColumnsHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "companyId e funnelId obrigatórios",
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");
  return CrmColumnRepository.listAll(companyId, data.funnelId);
});
