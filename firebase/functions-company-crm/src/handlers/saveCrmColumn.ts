import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler } from "functions-shared";
import { CrmColumnRepository } from "../repositories/crm-column.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({
  companyId: z.string().min(1),
  columnId: z.string().optional(),
  name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
  color: z.string().min(1, "Cor obrigatória"),
  order: z.number().optional(),
});

export const saveCrmColumnHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("saveCrmColumn", {
    companyId,
    action: data.columnId ? "update" : "create",
    columnId: data.columnId,
  });

  return CrmColumnRepository.save(companyId, data);
});
