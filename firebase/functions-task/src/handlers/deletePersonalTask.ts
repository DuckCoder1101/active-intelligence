import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import PersonalTaskSchema from "../data/personal-task.schema";
import { PersonalTaskRepository } from "../repositories/personal-task.repository";

export const deletePersonalTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } = PersonalTaskSchema.deleteSchema.safeParse(
    req.data,
  );
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

  logger.info("deletePersonalTask", {
    companyId,
    personalTaskId: data.personalTaskId,
  });

  await PersonalTaskRepository.delete(companyId, user.uid, data.personalTaskId);

  return true;
});
