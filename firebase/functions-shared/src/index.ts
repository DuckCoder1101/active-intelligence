// utils
export { onCallHandler } from "./utils/onCallHandler.util";
export { requireAccess } from "./utils/requireAccess.util";
export { requireCompanyAccess } from "./utils/requireCompanyAccess.util";
export { getAuthenticatedUser } from "./utils/getAuthenticatedUser.util";
export { auth, database, bucket } from "./utils/firebase";

// types
export type { UserAccessLevel } from "./types/accessLevel.type";

// enums
export { AuditAction } from "./enums/auditAction.enum";
export { BrazilianState } from "./enums/brazilianState.enum";

// constants
export { ADMIN_PERMISSIONS } from "./constants/permissions.const";

// domain: user (usado por admin, company-user e user)
export { default as UserSchema } from "./domain/user/user.schema";

// domain: admin (usado por user, task, company e admin)
export { default as AdminRepository } from "./domain/admin/admin.repository";
export { AdminAccessLevels } from "./domain/admin/accessLevels.const";

// domain: company (usado por task e company)
export { default as CompanySchema } from "./domain/company/company.schema";
export type { CompanyAuditDocument } from "./domain/company/company-audit.document";
export { CompanyRepository } from "./domain/company/company.repository";
export { AuditRepository } from "./domain/company/audit.repository";
export { default as CompanyOperationalSchema } from "./domain/company/company-operational.schema";
export { CompanyOperationalRepository } from "./domain/company/company-operational.repository";

// domain: company-user (usado por user e company-user)
export { default as CompanyUserRepository } from "./domain/company-user/company-user.repository";

// domain: operational-kanban (usado por operational-kanban e task)
export { OperationalKanbanRepository } from "./domain/operational-kanban/operational-kanban.repository";
export {
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
} from "./domain/operational-kanban/operational-kanban.document";

// domain: real-estate (usado por company-crm e real-estate)
export { PROPERTY_TYPES } from "./domain/real-estate/propertyType.enum";
export type { PropertyType } from "./domain/real-estate/propertyType.enum";
export { PROPERTY_FEATURES } from "./domain/real-estate/propertyFeature.enum";
export type { PropertyFeature } from "./domain/real-estate/propertyFeature.enum";

// domain: notification (usado por admin e task)
export { default as NotificationRepository } from "./domain/notification/notification.repository";
export type { NotificationFilterDTO } from "./domain/notification/notification.dtos";
