import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import { TaskRepository } from "../repositories/task.repository";

const ACCESS = { minAccessLevel: "admin" as const };

const schema = z.object({ taskId: z.string().min(1) });

export const getTaskHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "taskId obrigatório",
      error.issues,
    );
  }

  logger.info("getTask", { taskId: data.taskId });

  return TaskRepository.getById(data.taskId);
});
