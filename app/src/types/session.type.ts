import type { UserAccessLevel } from '@t/user.model';

export interface FirebaseTokenClaims {
  uid: string;
  email: string;
  accessLevel: UserAccessLevel;
}
