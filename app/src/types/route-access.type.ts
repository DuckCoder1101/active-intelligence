import type { UserAccessLevel } from '@/types/access-level.type';
import type { AdminPermission } from '@/types/permissions.type';

export interface RouteAccessLevel {
  minAccessLevel: UserAccessLevel;
  permissions?: AdminPermission[];
}
