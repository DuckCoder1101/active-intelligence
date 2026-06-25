import { HttpsError } from 'firebase-functions/https';
import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
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

  return KanbanRepository.save(data);
});
