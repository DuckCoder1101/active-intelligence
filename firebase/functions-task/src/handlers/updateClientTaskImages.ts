import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, getAuthenticatedUser } from "functions-shared";
import { TaskRepository } from "../repositories/task.repository";

const schema = z.object({
  taskId: z.string().min(1, "taskId obrigatório"),
  referenceImages: z.array(z.string()).default([]),
  companyId: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

/**
 * Updates reference images on a client task.
 * Auth: `getAuthenticatedUser(req)` + custom role branching (user vs admin/owner).
 * Schema: inline `z.object({taskId, referenceImages, companyId?})`.
 */
export const updateClientTaskImagesHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } = schema.safeParse(req.data);
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

  logger.info("updateClientTaskImages", {
    taskId: data.taskId,
    count: data.referenceImages.length,
  });

  await TaskRepository.updateImages(
    data.taskId,
    companyId,
    data.referenceImages,
  );

  return { success: true };
});
