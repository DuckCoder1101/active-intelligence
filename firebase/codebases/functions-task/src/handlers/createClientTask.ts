import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  getAuthenticatedUser,
  CompanyRepository,
  AuditRepository,
  AuditAction,
  NotificationRepository,
  NotificationFilterDTO,
  AdminTasksBoardRepository,
} from "functions-shared";
import TaskSchema from "../data/task.schema";
import { TaskRepository } from "../repositories/task.repository";

/**
 * Client or admin creates a client-facing task, with usage-limit check and notification.
 * Auth: `getAuthenticatedUser(req)` + custom role branching (user vs admin/owner).
 * Schema: `../data/task.schema` → `TaskSchema.createClientTaskSchema`.
 * Note: orchestrates multiple repositories (`CompanyRepository`, `AdminTasksBoardRepository`, `AuditRepository`, `NotificationRepository`) beyond a single repository call.
 */
export const createClientTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } = TaskSchema.createClientTaskSchema.safeParse(
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

  logger.info("createClientTask", {
    companyId,
    categoryId: data.categoryId,
    uid: user.uid,
  });

  await CompanyRepository.checkAndIncrementUsage(companyId);

  const columns = await AdminTasksBoardRepository.listAll();

  const task = await TaskRepository.save({
    companyId,
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId,
    status: columns[0].columnId,
    dueDate: data.dueDate,
    assignedTo: [],
    referenceLinks: data.referenceLinks,
    referenceImages: data.referenceImages,
    createdByName: data.createdByName,
    createdBy: user.uid,
  });

  AuditRepository.log(companyId, {
    action: AuditAction.task_created,
    actorUid: user.uid,
    actorName: data.createdByName ?? "(usuário)",
    taskId: task.taskId,
    taskTitle: task.title,
  });

  const filter: NotificationFilterDTO =
    task.assignedTo.length > 0
      ? { uids: task.assignedTo }
      : { permission: "manage-projects" };

  await NotificationRepository.notify(filter, {
    type: "new-client-task",
    message: `Nova tarefa recebida: "${task.title}"`,
    taskId: task.taskId,
    companyId,
  });

  return task;
});
