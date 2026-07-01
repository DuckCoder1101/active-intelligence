import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import { onCallHandler, requireAccess } from 'functions-shared';
import { KanbanRepository } from '../repositories/kanban.repository';
import { KanbanSchema } from '../data/kanban.schema';

const ACCESS = { minAccessLevel: 'owner' as const };

export const saveKanbanColumnHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = KanbanSchema.saveColumnSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  logger.info('saveColumn', { action: data.columnId ? 'update' : 'create', columnId: data.columnId });

  return KanbanRepository.save(data);
});
