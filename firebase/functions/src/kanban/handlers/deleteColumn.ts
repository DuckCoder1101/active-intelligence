import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { KanbanRepository } from '../repositories/kanban.repository';

const ACCESS = { minAccessLevel: 'owner' as const };

export const deleteKanbanColumnHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const { columnId } = req.data as { columnId?: string };
  if (!columnId)
    throw new HttpsError('invalid-argument', 'columnId obrigatório');
  return KanbanRepository.delete(columnId);
});
