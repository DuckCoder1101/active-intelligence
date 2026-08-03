import type { AdminPermission } from '@/types/permissions.type';

export type CustomClaims =
  | {
      accessLevel?: 'user';
      complete?: boolean;
      companyId?: string;
      lastReviewAt?: number;
    }
  | {
      accessLevel?: 'admin' | 'owner';
      complete?: boolean;
      permissions?: AdminPermission[];
    };
