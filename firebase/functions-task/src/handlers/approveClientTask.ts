import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import {
  onCallHandler,
  getAuthenticatedUser,
  AuditRepository,
  AuditAction,
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
} from 'functions-shared';
import TaskSchema from '../data/task.schema';
import { TaskRepository } from '../repositories/task.repository';

export const approveClientTaskHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  if (user.accessLevel !== 'user') {
    throw new HttpsError(
      'permission-denied',
      'Apenas usuários de empresa podem aprovar tarefas.',
    );
  }

  const companyId = req.auth!.token['companyId'] as string | undefined;
  if (!companyId) {
    throw new HttpsError(
      'failed-precondition',
      'Usuário não vinculado a nenhuma empresa.',
    );
  }

  const { success, data, error } = TaskSchema.approveClientTaskSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  const task = await TaskRepository.getById(data.taskId);

  if (task.companyId !== companyId) {
    throw new HttpsError(
      'permission-denied',
      'Sem permissão para editar esta tarefa.',
    );
  }

  if (task.status !== PENDING_APPROVAL_COLUMN_ID) {
    throw new HttpsError(
      'failed-precondition',
      'Esta tarefa não está aguardando aprovação.',
    );
  }

  logger.info('approveClientTask', { taskId: data.taskId, companyId });

  await TaskRepository.updateStatus(data.taskId, APPROVED_COLUMN_ID);

  AuditRepository.log(companyId, {
    action: AuditAction.task_column_moved,
    actorUid: user.uid,
    actorName: data.actorName ?? '(cliente)',
    taskId: task.taskId,
    taskTitle: task.title,
  });

  return true;
});
