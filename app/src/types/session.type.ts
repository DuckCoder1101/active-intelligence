import type { UserAccessLevel } from '@/models/user.model';

export interface CustomClaims {
  accessLevel?: UserAccessLevel;
  complete?: boolean;
}

export interface FirebaseTokenClaims extends CustomClaims {
  uid: string;
  email: string;
}
