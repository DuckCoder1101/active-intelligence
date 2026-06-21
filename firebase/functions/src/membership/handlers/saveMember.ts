import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import MembershipSchema from '../data/membership.schema';
import { MembershipService } from '../services/membership.service';
import UserRepository from '../../user/repositories/user.repository';

export const saveMemberHandler = onCallHandler(async (req) => {
  const { uid: actorUid, accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data, error } = MembershipSchema.saveMemberSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  const uid = await UserRepository.findUidByCpf(data.cpf);

  if (!uid) {
    throw new HttpsError('not-found', 'Nenhum usuário encontrado com este CPF!');
  }

  await MembershipService.saveMembership(
    { uid, companyId: data.companyId, role: data.role },
    actorUid,
  );

  return true;
});
