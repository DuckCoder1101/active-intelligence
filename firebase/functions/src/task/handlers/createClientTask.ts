import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import TaskSchema from '../data/task.schema';
import { TaskRepository } from '../repositories/task.repository';
import { CompanyRepository } from '../../company/repositories/company.repository';
import { AuditRepository } from '../../company/repositories/audit.repository';
import { AuditAction } from '../../shared/enums/auditAction.enum';

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

  const task = await TaskRepository.save({
    companyId,
    title: data.title,
    description: data.description,
    type: data.type,
    status: 'pending_approval',
    approvalStatus: 'pending_approval',
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

  return task;
});
