import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const getTaskHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const { taskId } = req.data as { taskId?: string };

  if (!taskId) {
    throw new HttpsError('invalid-argument', 'taskId obrigatório');
  }

  return TaskRepository.getById(taskId);
});
