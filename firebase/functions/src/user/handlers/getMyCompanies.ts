import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { MembershipRepository } from '../../membership/repositories/membership.repository';
import { CompanyRepository } from '../../company/repositories/company.repository';

export const getMyCompaniesHandler = onCallHandler(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);

  if (accessLevel === 'admin') {
    return CompanyRepository.getAllCompanyResumes();
  }

  return MembershipRepository.getCompanyResumesForUser(uid);
});
