import type { UserAccessLevel } from '@t/user.model';

export interface CustomClaims {
  accessLevel?: UserAccessLevel;
  complete?: boolean;
}

export interface FirebaseTokenClaims extends CustomClaims {
  uid: string;
  email: string;
}
