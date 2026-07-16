import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  CompanyOperationalSchema,
  CompanyOperationalRepository,
  requireAccess,
} from "functions-shared";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-projects" as const],
};

export const saveCompanyOperationalRecordHandler = onCallHandler(
  async (req) => {
    const { uid } = requireAccess(req, ACCESS);

    const { success, data, error } =
      CompanyOperationalSchema.saveSchema.safeParse(req.data);

    if (!success) {
      throw new HttpsError("invalid-argument", error.issues[0]?.message ?? "Dados inválidos!");
    }

    logger.info("saveCompanyOperationalRecord", { companyId: data.companyId });

    await CompanyOperationalRepository.save(data, uid);

    return true;
  },
);
