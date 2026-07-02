import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess, KanbanRepository } from 'functions-shared';

const ACCESS = { minAccessLevel: 'user' as const };

export const listKanbanColumnsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await KanbanRepository.listAll();
  logger.info('listColumns: retornando N itens', { count: result.length });
  return result;
});
