import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { CompanyRepository } from '../repositories/company.repository';

export const listCompaniesHandler = onCallHandler(async (req) => {
  const { accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  return CompanyRepository.getAllCompanies();
});
