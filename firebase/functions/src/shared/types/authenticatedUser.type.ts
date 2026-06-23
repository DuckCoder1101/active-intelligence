import { AdminPermission, UserAccessLevel } from './accessLevel.type';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  accessLevel: UserAccessLevel;
  permissions: AdminPermission[];
}
