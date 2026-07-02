import { HttpsError } from 'firebase-functions/https';
import z from 'zod';

import { onCallHandler, requireAccess, NotificationRepository } from 'functions-shared';
import AdminSchema from '../data/admin.schema';

const ACCESS = { minAccessLevel: 'admin' as const };

export const markNotificationReadHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } =
    AdminSchema.markNotificationReadSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  await NotificationRepository.markRead(caller.uid, data.notificationId);

  return true;
});
