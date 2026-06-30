import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { TaskRepository } from '../repositories/task.repository';
import { CompanyRepository } from '../../company/repositories/company.repository';

export const listClientTasksHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  let companyId: string | undefined;

  if (user.accessLevel === 'user') {
    companyId = req.auth!.token['companyId'] as string | undefined;
    if (!companyId) {
      throw new HttpsError(
        'failed-precondition',
        'Usuário não vinculado a nenhuma empresa.',
      );
    }
  } else if (user.accessLevel === 'admin' || user.accessLevel === 'owner') {
    companyId = (req.data as { companyId?: string })?.companyId;
    if (!companyId) {
      throw new HttpsError(
        'invalid-argument',
        'companyId é obrigatório para administradores.',
      );
    }
  } else {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  logger.info('listClientTasks', { companyId });

  const [tasks, usage] = await Promise.all([
    TaskRepository.listByCompany(companyId),
    CompanyRepository.getTaskUsage(companyId),
  ]);

  logger.info('listClientTasks: retornando N itens', { companyId, count: tasks.length });

  return { tasks, usage };
});
