import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler } from "functions-shared";
import { CrmColumnRepository } from "../repositories/crm-column.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({
  companyId: z.string().min(1),
  columnId: z.string().min(1),
});

export const deleteCrmColumnHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "columnId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("deleteCrmColumn", { companyId, columnId: data.columnId });

  return CrmColumnRepository.delete(companyId, data.columnId);
});
