import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser.util';
import { onCallHandler } from '@shared/utils/onCallHandler.util';

import UserRepository from '../repositories/user.repository';

export const getMeHandler = onCallHandler(async (req) => {
  const { uid, accessLevel, permissions } = getAuthenticatedUser(req);
  return UserRepository.getProfile(uid, accessLevel, permissions);
});
