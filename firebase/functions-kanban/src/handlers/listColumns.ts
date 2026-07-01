import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess } from 'functions-shared';
import { KanbanRepository } from '../repositories/kanban.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

export const listKanbanColumnsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await KanbanRepository.listAll();
  logger.info('listColumns: retornando N itens', { count: result.length });
  return result;
});
