import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import MembershipSchema from '../data/membership.schema';
import { MembershipService } from '../services/membership.service';

export const removeMemberHandler = onCallHandler(async (req) => {
  const { uid: actorUid, accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data, error } = MembershipSchema.removeMemberSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  await MembershipService.deleteMembership(data, actorUid);

  return true;
});
