import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  CompanyRepository,
  requireAccess,
} from "functions-shared";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-clients" as const],
};

const schema = z.object({ companyId: z.string().min(1) });

export const getCompanyHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError("invalid-argument", "companyId inválido!");
  }

  logger.info("getCompany", { companyId: data.companyId });

  return CompanyRepository.getCompanyById(data.companyId);
});
