import {z} from "zod";
import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";

import {onCallHandler, requireAccess, bucket} from "functions-shared";
import {TaskRepository} from "../repositories/task.repository";

const ACCESS = {minAccessLevel: "owner" as const};

const schema = z.object({taskId: z.string().min(1)});

export const deleteTaskHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "taskId obrigatório",
      error.issues,
    );
  }

  const {taskId} = data;

  logger.info("deleteTask", {taskId});

  const task = await TaskRepository.delete(taskId);

  if (task.hasMedia) {
    const prefix = `client/${task.companyId}/tasks/${taskId}/`;
    await bucket.deleteFiles({prefix}).catch((err) => logger.warn(
      "deleteTask: falha ao limpar storage",
      {taskId, err: String(err)},
    ));
  }

  return true;
});
