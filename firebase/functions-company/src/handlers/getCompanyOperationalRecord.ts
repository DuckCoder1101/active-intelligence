import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  CompanyOperationalRepository,
  requireAccess,
} from "functions-shared";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-projects" as const],
};

const schema = z.object({ companyId: z.string().min(1) });

export const getCompanyOperationalRecordHandler = onCallHandler(
  async (req) => {
    requireAccess(req, ACCESS);

    const { success, data } = schema.safeParse(req.data);

    if (!success) {
      throw new HttpsError("invalid-argument", "companyId inválido!");
    }

    logger.info("getCompanyOperationalRecord", { companyId: data.companyId });

    return CompanyOperationalRepository.getByCompanyId(data.companyId);
  },
);
