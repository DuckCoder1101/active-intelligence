import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const listTasksHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return TaskRepository.listAll();
});
