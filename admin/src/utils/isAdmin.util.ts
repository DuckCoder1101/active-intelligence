import type { CustomClaims } from '@/types/custom-claims.type';

export function isAdmin(sessionUser: CustomClaims | null | undefined): boolean {
  return sessionUser?.accessLevel === 'admin' || sessionUser?.accessLevel === 'owner';
}
