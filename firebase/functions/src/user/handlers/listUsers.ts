import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { requireAccess } from '@shared/utils/requireAccess.util';

import UserRepository from '../repositories/user.repository';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-users' as const],
};

export const listUsersHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return UserRepository.listAll();
});
