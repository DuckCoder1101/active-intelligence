import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import {
  onCallHandler,
  requireAccess,
  AdminRepository,
  AuditRepository,
  AuditAction,
} from 'functions-shared';
import TaskSchema from '../data/task.schema';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const saveTaskHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = TaskSchema.saveSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  if (data.taskId) {
    const existing = await TaskRepository.getById(data.taskId);

    if (caller.accessLevel !== 'owner') {
      const canEdit =
        existing.assignedTo.length === 0 ||
        existing.assignedTo.includes(caller.uid);
      if (!canEdit) {
        throw new HttpsError(
          'permission-denied',
          'Você não está atribuído a esta tarefa.',
        );
      }

      data.assignedTo = existing.assignedTo;
      data.companyId = existing.companyId;
    }
  } else if (caller.accessLevel !== 'owner') {
    data.assignedTo = [];
  }

  const isUpdate = !!data.taskId;
  logger.info('saveTask', { action: isUpdate ? 'update' : 'create', taskId: data.taskId });

  const task = await TaskRepository.save({ ...data, createdBy: caller.uid });

  logger.info('saveTask: concluído', { taskId: task.taskId });

  const actorName = await AdminRepository.getResumeByUid(caller.uid)
    .then((r) => r.name)
    .catch(() => '(admin)');

  AuditRepository.log(task.companyId, {
    action: isUpdate ? AuditAction.task_updated : AuditAction.task_created,
    actorUid: caller.uid,
    actorName,
    taskId: task.taskId,
    taskTitle: task.title,
  });

  return task;
});
