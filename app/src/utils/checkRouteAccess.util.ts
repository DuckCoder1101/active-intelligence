import type { RouteAccessLevel } from '@/types/route-access.type';
import type { UserAccessLevel } from '@/models/user.model';
import type { CustomClaims } from '@/types/session.type';

const LEVEL_ORDER: UserAccessLevel[] = ['user', 'admin', 'owner'];

export function checkRouteAccess(
  sessionUser: CustomClaims,
  access: RouteAccessLevel,
): boolean {
  const level: UserAccessLevel = sessionUser.accessLevel ?? 'user';
  if (level === 'owner') return true;

  const userIndex = LEVEL_ORDER.indexOf(level);
  const minIndex = LEVEL_ORDER.indexOf(access.minAccessLevel);

  const userPerms = sessionUser.permissions ?? [];
  const hasPerms =
    access.permissions?.every((p) => userPerms.includes(p)) ?? true;

  return userIndex >= minIndex && hasPerms;
}
