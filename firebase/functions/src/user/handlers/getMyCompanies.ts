import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { MembershipRepository } from '../../membership/repositories/membership.repository';

export const getMyCompaniesHandler = onCallHandler(async (req) => {
  const { uid } = getAuthenticatedUser(req);

  return await MembershipRepository.getCompanyResumesForUser(uid);
});
