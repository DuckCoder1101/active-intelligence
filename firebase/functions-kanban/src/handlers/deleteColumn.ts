import z from 'zod';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess } from 'functions-shared';
import { KanbanRepository } from '../repositories/kanban.repository';

const ACCESS = { minAccessLevel: 'owner' as const };

const schema = z.object({ columnId: z.string().min(1) });

export const deleteKanbanColumnHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', 'columnId obrigatório', error.issues);
  }

  logger.info('deleteColumn', { columnId: data.columnId });

  return KanbanRepository.delete(data.columnId);
});
