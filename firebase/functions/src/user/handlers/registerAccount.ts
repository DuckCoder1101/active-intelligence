import z from 'zod';
import { onCall, HttpsError } from 'firebase-functions/https';

import { auth } from '@shared/firebase';

import UserRepository from '../repositories/user.repository';
import UserSchema from '../data/user.schema';

export const registerAccountHandler = onCall(async (req) => {
  const { success, data, error } = UserSchema.registerUserSchema.safeParse(
    req.data,
  );

  // Verifica os dados do Zod
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos ao cadastrar conta!',
      z.treeifyError(error),
    );
  }

  // Verifica se o CPF já existe
  const cpfAlreadyRegistered = await UserRepository.cpfExists(data.cpf);
  if (cpfAlreadyRegistered) {
    throw new HttpsError('already-exists', 'Este CPF já está cadastrado!');
  }

  // Cria o perfil do usuário no Authentication
  const { uid } = await auth.createUser({
    email: data.email,
    password: data.password,
  });

  await Promise.all([
    auth.setCustomUserClaims(uid, {
      accessLevel: 'client',
    }),
    UserRepository.saveUser(uid, data),
  ]);

  const token = await auth.createCustomToken(uid);
  return token;
});
