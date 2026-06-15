import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { onCallHandler } from '@shared/utils/onCallHandler';

import UserRepository from '../repositories/user.repository';

export const getMeHandler = onCallHandler(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);
  const profile = await UserRepository.getUserProfile(uid, accessLevel);

  return profile;
});
