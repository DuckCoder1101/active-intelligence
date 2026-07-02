import type { UserProfile } from '@/models/user-profile.model';
import type { AdminPermission } from '@/types/permissions.type';

export type AdminAccessLevel = 'admin' | 'owner';

export interface AdminProfile extends UserProfile {
  accessLevel: AdminAccessLevel;
  permissions: AdminPermission[];
}
