export type UserAccessLevel = "owner" | "admin" | "user";

export type AdminAccessLevel = "owner" | "admin";

export type AdminPermission =
  | "manage-clients"
  | "manage-projects"
  | "manage-crm"
  | "manage-proposals"
  | "manage-contracts"
  | "manage-diagnostics"
  | "manage-creation"
  | "manage-finance"
  | "manage-intelligence"
  | "manage-catalog"
  | "manage-team"
  | "manage-settings";

export interface BackendAccessLevel {
  minAccessLevel: UserAccessLevel;
  permissions?: AdminPermission[];
}
