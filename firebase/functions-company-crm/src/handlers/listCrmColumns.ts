import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler } from "functions-shared";
import { CrmColumnRepository } from "../repositories/crm-column.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({ companyId: z.string().min(1) });

export const listCrmColumnsHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);
  return CrmColumnRepository.listAll(companyId);
});
