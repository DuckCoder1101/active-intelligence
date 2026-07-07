import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import { onCallHandler, requireAccess, OperationalKanbanRepository } from 'functions-shared';
import { OperationalKanbanSchema } from '../data/operational-kanban.schema';

const ACCESS = { minAccessLevel: 'owner' as const };

export const saveOperationalKanbanColumnHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = OperationalKanbanSchema.saveColumnSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  logger.info('saveOperationalKanbanColumn', { action: data.columnId ? 'update' : 'create', columnId: data.columnId });

  return OperationalKanbanRepository.save(data);
});
