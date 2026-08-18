import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import CompanyInternalTaskSchema from "../data/company-internal-task.schema";
import { CompanyInternalTaskRepository } from "../repositories/company-internal-task.repository";

/**
 * Creates/updates a company-internal task.
 * Auth: `getAuthenticatedUser(req)` + custom role branching (user vs admin/owner).
 * Schema: `../data/company-internal-task.schema` → `CompanyInternalTaskSchema.saveSchema`.
 */
export const saveCompanyInternalTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } =
    CompanyInternalTaskSchema.saveSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

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
    if (!data.companyId) {
      throw new HttpsError(
        "invalid-argument",
        "companyId é obrigatório para administradores.",
      );
    }
    companyId = data.companyId;
  } else {
    throw new HttpsError("permission-denied", "Acesso negado.");
  }

  logger.info("saveCompanyInternalTask", {
    companyId,
    action: data.companyInternalTaskId ? "update" : "create",
    companyInternalTaskId: data.companyInternalTaskId,
  });

  return CompanyInternalTaskRepository.save(companyId, user.uid, data);
});
