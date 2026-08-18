import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import CompanyInternalTaskSchema from "../data/company-internal-task.schema";
import { CompanyInternalTaskRepository } from "../repositories/company-internal-task.repository";

/**
 * Deletes a user's company-internal task.
 * Auth: `getAuthenticatedUser(req)` + custom role branching (user vs admin/owner).
 * Schema: `../data/company-internal-task.schema` → `CompanyInternalTaskSchema.deleteSchema`.
 */
export const deleteCompanyInternalTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } =
    CompanyInternalTaskSchema.deleteSchema.safeParse(req.data);
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

  logger.info("deleteCompanyInternalTask", {
    companyId,
    companyInternalTaskId: data.companyInternalTaskId,
  });

  await CompanyInternalTaskRepository.delete(
    companyId,
    user.uid,
    data.companyInternalTaskId,
  );

  return true;
});
