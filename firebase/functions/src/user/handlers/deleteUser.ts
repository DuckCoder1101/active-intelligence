import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import UserRepository from '../repositories/user.repository';
import UserSchema from '../data/user.schema';
import { requireAccess } from '@shared/utils/requireAccess.util';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-users' as const],
};

export const deleteUserHandler = onCallHandler(async (req) => {
  const { uid: adminUid } = requireAccess(req, ACCESS);

  const { success, data, error } = UserSchema.deleteUserSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  if (data.targetUid === adminUid) {
    throw new HttpsError(
      'failed-precondition',
      'Você não pode excluir sua própria conta!',
    );
  }

  await UserRepository.delete(data.targetUid);
  return true;
});
