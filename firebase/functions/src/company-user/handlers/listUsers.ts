import z from 'zod';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';
import CompanyUserRepository from '../repository/company-user.repository';

const ACCESS = {
  minAccessLevel: 'admin' as const,
};

export const listCompanyUsersHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const schema = z.object({ companyId: z.string().min(1) });
  const { success, data, error } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'companyId obrigatório',
      z.treeifyError(error),
    );
  }

  logger.info('listUsers', { companyId: data.companyId });
  const result = await CompanyUserRepository.listByCompany(data.companyId);
  logger.info('listUsers: retornando N itens', { companyId: data.companyId, count: result.length });
  return result;
});
