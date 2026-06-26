import z from 'zod';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import UserSchema from '../data/user.schema';
import { auth } from '@shared/utils/firebase';
import { UserAccessLevel } from '@shared/types/accessLevel.type';
import CompanyUserRepository from '../../company-user/repository/company-user.repository';
import AdminRepository from '../../admin/repositories/admin.repository';

export const updateProfileHandler = onCallHandler(async (req) => {
  const { uid: authorUid, accessLevel } = getAuthenticatedUser(req);

  const { data, success, error } = UserSchema.updateProfileSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos ao atualizar conta!',
      z.treeifyError(error),
    );
  }

  let targetUser;
  try {
    targetUser = await auth.getUser(data.targetId);
  } catch {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }

  const targetAccessLevel = targetUser.customClaims
    ?.accessLevel as UserAccessLevel | null;

  if (
    data.targetId !== authorUid &&
    (accessLevel !== 'owner' || targetAccessLevel === 'owner')
  ) {
    throw new HttpsError(
      'permission-denied',
      'Você não tem permissão para alterar a conta de outro usuário.',
    );
  }

  if (!targetAccessLevel) {
    throw new HttpsError(
      'invalid-argument',
      'O usuário não tem nível de acesso definido!',
    );
  }

  logger.info('updateProfile', {
    targetUid: data.targetId,
    callerUid: authorUid,
    targetAccessLevel,
  });

  if (targetAccessLevel === 'user') {
    await CompanyUserRepository.update(data);
  } else {
    await AdminRepository.update(data);
  }
});
