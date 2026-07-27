import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import { PersonalTaskRepository } from "../repositories/personal-task.repository";

export const listPersonalTasksHandler = onCallHandler(async (req) => {
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

  logger.info("listPersonalTasks", { companyId });

  return PersonalTaskRepository.listByUser(companyId, user.uid);
});
