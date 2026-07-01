import type { IconType } from 'react-icons';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  badge?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
