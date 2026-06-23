import type { UserAccessLevel } from '@/models/user.model';
import type { AdminPermission } from '@/types/permissions.type';

export interface RouteAccessLevel {
  minAccessLevel: UserAccessLevel;
  permissions?: AdminPermission[];
}
