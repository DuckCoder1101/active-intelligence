import z from 'zod';
import { FirebaseAuthError } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { auth } from '@shared/firebase';
import UserSchema from '../data/user.schema';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-users' as const],
};

export const inviteUserHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = UserSchema.inviteUserSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  try {
    await auth.createUser({
      email: data.email,
      emailVerified: false,
    });
  } catch (err) {
    if (
      err instanceof FirebaseAuthError &&
      err.code === 'auth/email-already-exists'
    ) {
      throw new HttpsError('already-exists', 'Este e-mail já está cadastrado.');
    }

    throw err;
  }

  return true;
});
