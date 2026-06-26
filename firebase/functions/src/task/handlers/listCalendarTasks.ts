import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { TaskRepository } from '../repositories/task.repository';

const schema = z.object({
  companyId: z.string().optional(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(0).max(11),
});

export const listCalendarTasksHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', error.issues.map((i) => i.message).join(', '));
  }

  let companyId: string;

  if (user.accessLevel === 'user') {
    const cid = req.auth!.token['companyId'] as string | undefined;
    if (!cid) {
      throw new HttpsError('failed-precondition', 'Usuário não vinculado a nenhuma empresa.');
    }
    companyId = cid;
  } else if (user.accessLevel === 'admin' || user.accessLevel === 'owner') {
    if (!data.companyId) {
      throw new HttpsError('invalid-argument', 'companyId é obrigatório para administradores.');
    }
    companyId = data.companyId;
  } else {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  logger.info('listCalendarTasks', { companyId, year: data.year, month: data.month });

  const tasks = await TaskRepository.listByCompanyAndMonth(companyId, data.year, data.month);

  return { tasks };
});
