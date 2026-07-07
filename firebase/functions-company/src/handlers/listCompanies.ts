import { logger } from 'firebase-functions';

import { onCallHandler, CompanyRepository, requireAccess } from 'functions-shared';

const ACCESS = {
  minAccessLevel: 'admin' as const,
};

export const listCompaniesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await CompanyRepository.getAllCompanies();
  logger.info('listCompanies: retornando N itens', { count: result.length });
  return result;
});
