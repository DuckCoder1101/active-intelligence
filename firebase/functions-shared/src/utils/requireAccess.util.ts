import { CallableRequest, HttpsError } from 'firebase-functions/https';
import { getAuthenticatedUser } from './getAuthenticatedUser.util';
import { LEVEL_ORDER } from '../constants/levelOrder.const';
import { BackendAccessLevel } from '../types/accessLevel.type';
import { AuthenticatedUser } from '../types/authenticatedUser.type';

export function requireAccess(
  req: CallableRequest,
  access: BackendAccessLevel,
): AuthenticatedUser {
  const user = getAuthenticatedUser(req);
  if (user.accessLevel === 'owner') return user;

  const userIndex = LEVEL_ORDER.indexOf(user.accessLevel);
  const minIndex = LEVEL_ORDER.indexOf(access.minAccessLevel);

  const userPerms = user.permissions ?? [];
  const hasPerms =
    access.permissions?.every((p) => userPerms.includes(p)) ?? true;

  if (userIndex < minIndex || !hasPerms) {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  return user;
}
