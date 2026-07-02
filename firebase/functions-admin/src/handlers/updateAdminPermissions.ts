import z from 'zod';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess, auth } from 'functions-shared';
import AdminSchema from '../data/admin.schema';

const ACCESS = { minAccessLevel: 'owner' as const };

export const updateAdminPermissionsHandler = onCallHandler(async (req) => {
  const { uid: callerUid } = requireAccess(req, ACCESS);

  const { success, data, error } =
    AdminSchema.updatePermissionsSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  if (data.targetUid === callerUid) {
    throw new HttpsError(
      'invalid-argument',
      'Você não pode alterar suas próprias permissões.',
    );
  }

  logger.info('updateAdminPermissions', {
    targetUid: data.targetUid,
    permissions: data.permissions,
    callerUid: callerUid,
  });

  await auth.setCustomUserClaims(data.targetUid, {
    complete: true,
    accessLevel: 'admin',
    permissions: data.permissions,
  });

  return true;
});
