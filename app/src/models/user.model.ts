import type { AdminPermission } from '@/types/permissions.type';

export type UserAccessLevel = 'owner' | 'admin' | 'user';

export interface UserProfile {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  accessLevel: UserAccessLevel;
  permissions: AdminPermission[];

  createdAt: number;
  updatedAt: number;
}
