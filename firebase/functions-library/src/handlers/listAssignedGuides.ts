import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const schema = z.object({ companyId: z.string().min(1) });

export const listAssignedGuidesHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "à Biblioteca");
  return GuideRepository.listByCompany(companyId);
});
