import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { KanbanRepository } from '../repositories/kanban.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const listKanbanColumnsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await KanbanRepository.listAll();
  logger.info('listColumns: retornando N itens', { count: result.length });
  return result;
});
