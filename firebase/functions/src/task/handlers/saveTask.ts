import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
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

  const task = await TaskRepository.save({ ...data, createdBy: caller.uid });
  return task;
});
