import z from 'zod';
import { FirebaseAuthError } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import { auth } from '@shared/utils/firebase';
import AdminSchema from '../data/admin.schema';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-team' as const],
};

export const inviteAdminHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = AdminSchema.inviteAdminSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  logger.info('inviteAdmin', { email: data.email });

  try {
    const userRecord = await auth.createUser({
      email: data.email,
      emailVerified: false,
    });

    logger.info('inviteAdmin: usuário criado', {
      uid: userRecord.uid,
      email: data.email,
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      accessLevel: 'admin',
      complete: false,
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
