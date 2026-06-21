import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { MembershipRepository } from '../repositories/membership.repository';

const schema = z.object({
  companyId: z.string().min(1),
});

export const listMembersByCompanyHandler = onCallHandler(async (req) => {
  const { accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError('invalid-argument', 'companyId inválido!');
  }

  return MembershipRepository.getMembershipsByCompanyId(data.companyId);
});
