import type { ElementType } from 'react';
import type { AdminPermission } from '@/types/permissions.type';

export type AdminModule = {
  icon: ElementType;
  label: string;
  description: string;
  to?: string;
  soon?: boolean;
  permission?: AdminPermission;
};

export type Section = {
  label: string;
  description: string;
  modules: AdminModule[];
};
