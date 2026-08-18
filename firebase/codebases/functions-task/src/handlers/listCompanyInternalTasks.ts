import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import { CompanyInternalTaskRepository } from "../repositories/company-internal-task.repository";

/**
 * Lists a user's company-internal tasks.
 * Auth: `getAuthenticatedUser(req)` + custom role branching (user vs admin/owner).
 * Schema: NONE — manual cast of `req.data`, no zod validation.
 */
export const listCompanyInternalTasksHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  let companyId: string;

  if (user.accessLevel === "user") {
    if (!user.companyId) {
      throw new HttpsError(
        "failed-precondition",
        "Usuário não vinculado a nenhuma empresa.",
      );
    }
    companyId = user.companyId;
  } else if (user.accessLevel === "admin" || user.accessLevel === "owner") {
    const data = req.data as { companyId?: string } | null;
    if (!data?.companyId) {
      throw new HttpsError(
        "invalid-argument",
        "companyId é obrigatório para administradores.",
      );
    }
    companyId = data.companyId;
  } else {
    throw new HttpsError("permission-denied", "Acesso negado.");
  }

  logger.info("listCompanyInternalTasks", { companyId });

  return CompanyInternalTaskRepository.listByUser(companyId, user.uid);
});
