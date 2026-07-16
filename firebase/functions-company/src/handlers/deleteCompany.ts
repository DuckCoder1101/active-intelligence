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

const deleteCompanySchema = z.object({
  companyId: z.string().min(1),
});

export const deleteCompanyHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = deleteCompanySchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  logger.info("deleteCompany", { companyId: data.companyId });

  await CompanyRepository.deleteCompany(data.companyId);

  return true;
});
