import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import { TaskRepository } from "../repositories/task.repository";

const ACCESS = { minAccessLevel: "admin" as const };

/**
 * Lists all internal tasks.
 * Auth: `requireAccess(req, {minAccessLevel:"admin"})`.
 * Schema: none.
 */
export const listTasksHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await TaskRepository.listAll();
  logger.info("listTasks: retornando N itens", { count: result.length });
  return result;
});
