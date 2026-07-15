import { logger } from 'firebase-functions';

import {
  getAuthenticatedUser,
  onCallHandler,
  CompanyUserRepository,
  AdminRepository,
} from 'functions-shared';

export const getMeHandler = onCallHandler(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);

  logger.info('getMe', { uid, accessLevel });

  if (accessLevel === 'user') {
    return await CompanyUserRepository.getProfile(uid);
  }

  return await AdminRepository.getProfile(uid);
});
