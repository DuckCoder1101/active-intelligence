import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { TaskRepository } from '../repositories/task.repository';

const schema = z.object({
  taskId: z.string().min(1, 'taskId obrigatório'),
  referenceImages: z.array(z.string()).default([]),
});

export const updateClientTaskImagesHandler = onCallHandler(async (req) => {
  const user = getAuthenticatedUser(req);

  if (user.accessLevel !== 'user') {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  const companyId = req.auth!.token['companyId'] as string | undefined;
  if (!companyId) {
    throw new HttpsError(
      'failed-precondition',
      'Usuário não vinculado a nenhuma empresa.',
    );
  }

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  logger.info('updateClientTaskImages', { taskId: data.taskId, count: data.referenceImages.length });

  await TaskRepository.updateImages(data.taskId, companyId, data.referenceImages);

  return { success: true };
});
