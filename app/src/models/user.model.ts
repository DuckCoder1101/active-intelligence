export type UserAccessLevel = 'client' | 'admin';

export interface UserProfile {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  accessLevel: UserAccessLevel;

  createdAt: number;
  updatedAt: number;
}
