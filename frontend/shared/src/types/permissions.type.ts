export type AdminPermission =
  | 'manage-clients'
  | 'manage-projects'
  | 'manage-crm'
  | 'manage-proposals'
  | 'manage-contracts'
  | 'manage-diagnostics'
  | 'manage-creation'
  | 'manage-finance'
  | 'manage-intelligence'
  | 'manage-catalog'
  | 'manage-team'
  | 'manage-settings';

export interface AdminPermissionMeta {
  key: AdminPermission;
  label: string;
  group: string;
}
