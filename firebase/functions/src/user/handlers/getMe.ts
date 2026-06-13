import { onCall } from 'firebase-functions/https';

import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';

import UserRepository from '../repositories/user.repository';

export const getMeHandler = onCall(async (req) => {
  const { uid, accessLevel } = getAuthenticatedUser(req);
  const profile = await UserRepository.getUserProfile(uid, accessLevel);

  return profile;
});
