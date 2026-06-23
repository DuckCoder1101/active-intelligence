import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import UserRepository from '../repositories/user.repository';
import UserSchema from '../data/user.schema';
import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { auth } from '@shared/firebase';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';

export const completeAccountHandler = onCallHandler(async (req) => {
  const { uid, email } = getAuthenticatedUser(req);

  const { success, data, error } = UserSchema.registerUserSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos ao cadastrar conta!',
      z.treeifyError(error),
    );
  }

  const cpfAlreadyRegistered = await UserRepository.cpfExists(data.cpf);
  if (cpfAlreadyRegistered) {
    throw new HttpsError('already-exists', 'Este CPF já está cadastrado!');
  }

  await Promise.all([
    UserRepository.save(uid, email, data),
    auth.updateUser(uid, {
      emailVerified: true,
    }),
    auth.setCustomUserClaims(uid, {
      accessLevel: 'user',
      complete: true,
      permissions: [],
    }),
  ]);
});
