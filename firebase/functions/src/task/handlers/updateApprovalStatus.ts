import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

const schema = z.object({
  taskId: z.string().min(1, 'taskId obrigatório'),
  approvalStatus: z.enum(['pending_approval', 'approved', 'in_progress', 'completed', 'rejected']),
});

export const updateApprovalStatusHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', error.issues.map((i) => i.message).join(', '));
  }

  logger.info('updateApprovalStatus', { taskId: data.taskId, approvalStatus: data.approvalStatus });

  return TaskRepository.updateApprovalStatus(data.taskId, data.approvalStatus);
});
