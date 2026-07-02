import type { UserAccessLevel } from '@/types/access-level.type';
import type { CustomClaims } from '@/types/custom-claims.type';
import type { RouteAccessLevel } from '@/types/route-access.type';

export function checkRouteAccess(
  sessionUser: CustomClaims | null,
  access: RouteAccessLevel,
): boolean {
  if (!sessionUser) {
    return false;
  }

  const level: UserAccessLevel = sessionUser.accessLevel ?? 'user';

  if (level === 'owner') {
    return true;
  }

  if (level === 'user' || access.minAccessLevel === 'owner') {
    return false;
  }

  const userPerms =
    ('permissions' in sessionUser ? sessionUser.permissions : undefined) ?? [];

  const hasPerms =
    access.permissions?.every((p) => userPerms.includes(p)) ?? true;

  return hasPerms;
}
