export type UserAccessLevel = 'client' | 'admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  phone?: string;
  accessLevel: UserAccessLevel;
}
