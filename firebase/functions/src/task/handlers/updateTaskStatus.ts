import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import TaskSchema from '../data/task.schema';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const updateTaskStatusHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = TaskSchema.updateStatusSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  if (caller.accessLevel !== 'owner') {
    const task = await TaskRepository.getById(data.taskId);
    const canEdit =
      task.assignedTo.length === 0 || task.assignedTo.includes(caller.uid);
    if (!canEdit) {
      throw new HttpsError(
        'permission-denied',
        'Você não está atribuído a esta tarefa.',
      );
    }
  }

  await TaskRepository.updateStatus(data.taskId, data.status);
  return true;
});
