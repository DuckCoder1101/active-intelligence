import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { CompanyRepository } from '../repositories/company.repository';
import { requireAccess } from '@shared/utils/requireAccess.util';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-clients' as const],
};

export const listCompaniesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return CompanyRepository.getAllCompanies();
});
