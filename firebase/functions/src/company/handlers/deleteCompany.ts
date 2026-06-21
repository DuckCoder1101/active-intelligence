import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { CompanyRepository } from '../repositories/company.repository';

const deleteCompanySchema = z.object({
  companyId: z.string().min(1),
});

export const deleteCompanyHandler = onCallHandler(async (req) => {
  const { accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data, error } = deleteCompanySchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  await CompanyRepository.deleteCompany(data.companyId);

  return true;
});
