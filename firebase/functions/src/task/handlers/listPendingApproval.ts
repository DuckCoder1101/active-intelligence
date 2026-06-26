import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const listPendingApprovalHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await TaskRepository.listPendingApproval();
  logger.info('listPendingApproval: retornando N itens', { count: result.length });
  return result;
});
