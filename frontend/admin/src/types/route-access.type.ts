import type { AdminPermission } from '@/types/permissions.type';

export interface RouteAccessLevel {
  minAccessLevel: 'admin' | 'owner';
  permissions?: AdminPermission[];
}
