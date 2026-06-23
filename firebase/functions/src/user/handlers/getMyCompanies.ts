import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { MembershipRepository } from '../../membership/repositories/membership.repository';

export const getMyCompaniesHandler = onCallHandler(async (req) => {
  const { uid } = getAuthenticatedUser(req);

  return await MembershipRepository.getCompanyResumesForUser(uid);
});
