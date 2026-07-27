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

const updateCompanyStatusSchema = z.object({
  companyId: z.string().min(1),
  active: z.boolean(),
});

export const updateCompanyStatusHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = updateCompanyStatusSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  logger.info("updateCompanyStatus", {
    companyId: data.companyId,
    active: data.active,
  });

  await CompanyRepository.setActive(data.companyId, data.active);

  return true;
});
