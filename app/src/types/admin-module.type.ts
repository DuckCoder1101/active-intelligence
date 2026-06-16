import type { ElementType } from 'react';

export type AdminModule = {
  icon: ElementType;
  label: string;
  description: string;
  to?: string;
  soon?: boolean;
};

export type Section = {
  label: string;
  description: string;
  modules: AdminModule[];
};
