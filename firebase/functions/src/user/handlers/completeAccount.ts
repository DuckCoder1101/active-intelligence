import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import UserRepository from '../repositories/user.repository';
import UserSchema from '../data/user.schema';
import { onCallHandler } from '@shared/utils/onCallHandler';
import { auth } from '@shared/firebase';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';

export const completeAccountHandler = onCallHandler(async (req) => {
  const { uid, email } = getAuthenticatedUser(req);

  const { success, data, error } = UserSchema.registerSchema.safeParse(
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
    auth.setCustomUserClaims(uid, {
      accessLevel: 'client',
      complete: true,
    }),
  ]);
});
