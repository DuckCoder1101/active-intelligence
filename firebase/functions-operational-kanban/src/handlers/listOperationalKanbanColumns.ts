import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess, OperationalKanbanRepository } from 'functions-shared';

const ACCESS = { minAccessLevel: 'user' as const };

export const listOperationalKanbanColumnsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await OperationalKanbanRepository.listAll();
  logger.info('listOperationalKanbanColumns: retornando N itens', { count: result.length });
  return result;
});
