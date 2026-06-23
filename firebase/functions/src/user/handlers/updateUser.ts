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

export const updateUserHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = UserSchema.updateUserSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  await UserRepository.update(data);
  return true;
});
