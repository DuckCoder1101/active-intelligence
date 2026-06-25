import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { KanbanRepository } from '../repositories/kanban.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const listKanbanColumnsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return KanbanRepository.listAll();
});
