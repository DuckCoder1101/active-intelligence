import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({
  companyId: z.string().min(1),
  guideId: z.string().min(1),
});

export const getAssignedGuideHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId e guideId obrigatórios");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);
  return GuideRepository.getForCompany(companyId, data.guideId);
});
