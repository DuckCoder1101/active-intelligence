import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import UserRepository from '../repositories/user.repository';
import UserSchema from '../data/user.schema';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { auth } from '@shared/firebase';

const ACCESS = {
  minAccessLevel: 'owner' as const,
};

export const deleteUserHandler = onCallHandler(async (req) => {
  const { uid: callerUid } = requireAccess(req, ACCESS);

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

  if (data.targetUid === callerUid) {
    throw new HttpsError(
      'failed-precondition',
      'Você não pode excluir sua própria conta!',
    );
  }

  const targetRecord = await auth.getUser(data.targetUid);
  const targetLevel = (targetRecord.customClaims as Record<string, unknown> | undefined)?.accessLevel;
  if (targetLevel === 'owner') {
    throw new HttpsError('permission-denied', 'Não é possível excluir um owner.');
  }

  await UserRepository.delete(data.targetUid);
  return true;
});
