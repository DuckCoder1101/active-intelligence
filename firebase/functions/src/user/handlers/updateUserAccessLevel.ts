import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import UserSchema from '../data/user.schema';
import UserRepository from '../repositories/user.repository';
import { onCallHandler } from '@shared/utils/onCallHandler';

export const updateUserAccessLevel = onCallHandler(async (req) => {
  const { success, data, error } = UserSchema.updateAccessLevelSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Uid ou nível de acesso inválido!',
      z.treeifyError(error),
    );
  }

  await UserRepository.updateAccessLevel(data.targetUid, data.newAccessLevel);
  return true;
});
