import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { CompanyRepository } from '../repositories/company.repository';
import { requireAccess } from '@shared/utils/requireAccess.util';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-clients' as const],
};

export const listCompaniesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await CompanyRepository.getAllCompanies();
  logger.info('listCompanies: retornando N itens', { count: result.length });
  return result;
});
