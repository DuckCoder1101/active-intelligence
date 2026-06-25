import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'owner' as const };

export const deleteTaskHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { taskId } = req.data as { taskId?: string };
  if (!taskId) {
    throw new HttpsError('invalid-argument', 'taskId obrigatório');
  }

  await TaskRepository.delete(taskId);
  return true;
});
