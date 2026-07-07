import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import {
  onCallHandler,
  getAuthenticatedUser,
  CompanyRepository,
  AuditRepository,
  AuditAction,
  AdminRepository,
  NotificationRepository,
  OperationalKanbanRepository,
} from 'functions-shared';
import TaskSchema from '../data/task.schema';
import { TaskRepository } from '../repositories/task.repository';

export const createClientTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  if (user.accessLevel !== 'user') {
    throw new HttpsError(
      'permission-denied',
      'Apenas usuários de empresa podem criar tarefas pelo portal.',
    );
  }

  const companyId = req.auth!.token['companyId'] as string | undefined;
  if (!companyId) {
    throw new HttpsError(
      'failed-precondition',
      'Usuário não vinculado a nenhuma empresa.',
    );
  }

  const { success, data, error } = TaskSchema.createClientTaskSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  logger.info('createClientTask', { companyId, type: data.type, uid: user.uid });

  await CompanyRepository.checkAndIncrementUsage(companyId);

  const columns = await OperationalKanbanRepository.listAll();

  const task = await TaskRepository.save({
    companyId,
    title: data.title,
    description: data.description,
    type: data.type,
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
    actorName: data.createdByName ?? '(usuário)',
    taskId: task.taskId,
    taskTitle: task.title,
  });

  const permissionUids = await AdminRepository.listUidsWithPermission(
    'manage-projects',
  );
  const targetUids = [...new Set([...permissionUids, ...task.assignedTo])];
  await NotificationRepository.notifyAdmins(targetUids, {
    type: 'new-client-task',
    message: `Nova tarefa recebida: "${task.title}"`,
    taskId: task.taskId,
    companyId,
  });

  return task;
});
