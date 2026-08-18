import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  requireAccess,
  AdminRepository,
  AuditRepository,
  AuditAction,
} from "functions-shared";
import TaskSchema from "../data/task.schema";
import { TaskRepository } from "../repositories/task.repository";

const ACCESS = { minAccessLevel: "admin" as const };

/**
 * Moves a task to a new kanban status, with assignment check and audit logging.
 * Auth: `requireAccess(req, {minAccessLevel:"admin"})`.
 * Schema: `../data/task.schema` → `TaskSchema.updateStatusSchema`.
 * Note: fire-and-forget `AuditRepository.log(...)` call after repository update.
 */
export const updateTaskStatusHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = TaskSchema.updateStatusSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const task = await TaskRepository.getById(data.taskId);

  if (caller.accessLevel !== "owner") {
    const canEdit =
      task.assignedTo.length === 0 || task.assignedTo.includes(caller.uid);
    if (!canEdit) {
      throw new HttpsError(
        "permission-denied",
        "Você não está atribuído a esta tarefa.",
      );
    }
  }

  logger.info("updateTaskStatus", { taskId: data.taskId, status: data.status });

  await TaskRepository.updateStatus(data.taskId, data.status);

  const actorName = await AdminRepository.getResumeByUid(caller.uid)
    .then((r) => r.name)
    .catch(() => "(admin)");

  AuditRepository.log(task.companyId, {
    action: AuditAction.task_column_moved,
    actorUid: caller.uid,
    actorName,
    taskId: task.taskId,
    taskTitle: task.title,
  });

  return true;
});
