// utils
export {onCallHandler} from "./utils/onCallHandler.util";
export {requireAccess} from "./utils/requireAccess.util";
export {getAuthenticatedUser} from "./utils/getAuthenticatedUser.util";
export {auth, database, bucket} from "./utils/firebase";

// types
export type {
  UserAccessLevel,
  AdminAccessLevel,
  AdminPermission,
  BackendAccessLevel,
} from "./types/accessLevel.type";
export type {AuthenticatedUser} from "./types/authenticatedUser.type";

// enums
export {AuditAction} from "./enums/auditAction.enum";
export {BrazilianState} from "./enums/brazilianState.enum";

// constants
export {LEVEL_ORDER} from "./constants/levelOrder.const";
export {ADMIN_PERMISSIONS} from "./constants/permissions.const";

// validations
export {checkCnpj} from "./validations/checkCNPJ";
export {checkCpf} from "./validations/checkCPF";
export {checkPhone} from "./validations/checkPhone";

// domain: user (usado por admin, company-user e user)
export {default as UserSchema} from "./domain/user/user.schema";
export type {
  UserProfileDTO,
  CompleteProfileDTO,
  UpdateProfileDTO,
  DeleteAccountDTO,
} from "./domain/user/user.dto";

// domain: admin (usado por user, task, company e admin)
export {default as AdminRepository} from "./domain/admin/admin.repository";
export type {AdminDocument} from "./domain/admin/admin.document";
export type {AdminResumeDTO, AdminProfileDTO} from "./domain/admin/admin.dtos";
export {AdminAccessLevels} from "./domain/admin/accessLevels.const";

// domain: company (usado por task e company)
export {default as CompanySchema} from "./domain/company/company.schema";
export type {CompanyDocument} from "./domain/company/company.document";
export type {
  CompanyAuditDocument,
} from "./domain/company/company-audit.document";
export type {
  RegisterCompanyDTO,
  CompanyFullDTO,
  CompanyTaskUsageDTO,
  CompanyResumeDTO,
} from "./domain/company/company.type";
export {CompanyRepository} from "./domain/company/company.repository";
export {AuditRepository} from "./domain/company/audit.repository";
export {BusinessSector} from "./domain/company/businessSector.enum";
export {CompanyStage} from "./domain/company/companyStage.emum";
export {RevenueRange} from "./domain/company/revenueRange.enum";

// domain: company-user (usado por user e company-user)
export {
  default as CompanyUserRepository,
} from "./domain/company-user/company-user.repository";
export type {
  CompanyUserDocument,
} from "./domain/company-user/company-user.document";
export type {
  InviteCompanyUserDTO,
  CompanyUserListDTO,
} from "./domain/company-user/company-user.dtos";

// domain: operational-kanban (usado por operational-kanban e task)
export {
  OperationalKanbanRepository,
} from "./domain/operational-kanban/operational-kanban.repository";
export type {
  OperationalKanbanColumnDocument,
} from "./domain/operational-kanban/operational-kanban.document";
export {
  DEFAULT_COLUMNS,
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
} from "./domain/operational-kanban/operational-kanban.document";
export type {
  OperationalKanbanColumnDTO,
  SaveOperationalKanbanColumnDTO,
} from "./domain/operational-kanban/operational-kanban.dtos";

// domain: notification (usado por admin e task)
export {
  default as NotificationRepository,
} from "./domain/notification/notification.repository";
export type {
  NotificationDocument,
  NotificationType,
} from "./domain/notification/notification.document";
export type {
  NotificationDTO,
  NotifyAdminsDTO,
} from "./domain/notification/notification.dtos";
