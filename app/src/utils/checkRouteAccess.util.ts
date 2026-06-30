import type { RouteAccessLevel } from '@/types/route-access.type';
import type { UserAccessLevel } from '@/types/access-level.type';
import type { CustomClaims } from '@/types/custom-claims.type';

const LEVEL_ORDER: UserAccessLevel[] = ['user', 'admin', 'owner'];

export function checkRouteAccess(
  sessionUser: CustomClaims | null,
  access: RouteAccessLevel,
): boolean {
  if (!sessionUser) return false;
  const level: UserAccessLevel = sessionUser.accessLevel ?? 'user';
  if (level === 'owner') return true;

  const userIndex = LEVEL_ORDER.indexOf(level);
  const minIndex = LEVEL_ORDER.indexOf(access.minAccessLevel);

  const userPerms = ('permissions' in sessionUser ? sessionUser.permissions : undefined) ?? [];
  const hasPerms =
    access.permissions?.every((p) => userPerms.includes(p)) ?? true;

  return userIndex >= minIndex && hasPerms;
}
