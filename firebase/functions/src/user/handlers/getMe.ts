import { logger } from 'firebase-functions';

import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { onCallHandler } from '@shared/utils/onCallHandler.util';
import CompanyUserRepository from '../../company-user/repository/company-user.repository';
import AdminRepository from '../../admin/repositories/admin.repository';

export const getMeHandler = onCallHandler(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);

  logger.info('getMe', { uid, accessLevel });

  if (accessLevel === 'user') {
    return await CompanyUserRepository.getProfile(uid);
  }

  return await AdminRepository.getProfile(uid);
});
