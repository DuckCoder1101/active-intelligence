/**
 * Manual test-only stand-in for the "functions-shared" package.
 *
 * Handler unit tests never hit the real vendored package (it's a gitignored,
 * build-step-dependent copy — see firebase/scripts/vendor-shared.js). Instead
 * vitest.config.ts aliases the bare specifier "functions-shared" straight to
 * this file, so every `import { onCallHandler, ... } from "functions-shared"`
 * in handler/repository source resolves here.
 *
 * - Cross-cutting utils (onCallHandler/requireAccess/requireCompanyAccess/
 *   getAuthenticatedUser/assertUniqueField) are vi.fn() with a sensible
 *   default implementation. Override per-test with mockImplementationOnce /
 *   mockReturnValueOnce to exercise failure branches.
 * - auth/database/bucket and the cross-domain repositories are lazy Proxy
 *   stubs: any property access returns a memoized vi.fn(), so
 *   `vi.mocked(AdminRepository.listAll).mockResolvedValue(...)` works for
 *   whatever method a given handler happens to call, without us having to
 *   hand-enumerate every repository method here.
 * - Plain constants/enums/zod schemas (no Firestore/side effects) are
 *   re-exported from the real functions-shared source so schema-validation
 *   behavior in tests stays accurate instead of being faked.
 */
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Cross-cutting utils
// ---------------------------------------------------------------------------

export const onCallHandler = vi.fn((handler: any) => handler);

export const requireAccess = vi.fn((_req: any, _access: any) => ({
  uid: "test-uid",
  email: "test@example.com",
  accessLevel: "admin",
  complete: true,
  permissions: [],
  companyId: undefined,
}));

export const requireCompanyAccess = vi.fn(
  (_req: any, companyId: string, _resourceLabel: string) => ({
    uid: "test-uid",
    companyId,
  }),
);

export const getAuthenticatedUser = vi.fn((req: any) => {
  const token = req?.auth?.token ?? {};
  return {
    uid: req?.auth?.uid ?? "test-uid",
    email: token.email ?? "test@example.com",
    accessLevel: token.accessLevel ?? "user",
    complete: token.complete ?? false,
    permissions: token.permissions,
    companyId: token.companyId,
  };
});

export const assertUniqueField = vi.fn(async () => undefined);

// ---------------------------------------------------------------------------
// Firebase handles / cross-domain repositories — lazy Proxy stubs
// ---------------------------------------------------------------------------

function createProxyStub(): any {
  const cache = new Map<PropertyKey, any>();
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (!cache.has(prop)) {
          cache.set(prop, vi.fn());
        }
        return cache.get(prop);
      },
    },
  );
}

export const auth = createProxyStub();
export const database = createProxyStub();
export const bucket = createProxyStub();

export const AdminRepository = createProxyStub();
export const CompanyRepository = createProxyStub();
export const AuditRepository = createProxyStub();
export const CompanyOperationalRepository = createProxyStub();
export const CompanyUserRepository = createProxyStub();
export const AdminTasksBoardRepository = createProxyStub();
export const NotificationRepository = createProxyStub();

// ---------------------------------------------------------------------------
// Plain constants/enums/schemas — real, side-effect-free source re-exports
// ---------------------------------------------------------------------------

export { PROPERTY_TYPES } from "../../../functions-shared/src/domain/real-estate/propertyType.enum";
export type { PropertyType } from "../../../functions-shared/src/domain/real-estate/propertyType.enum";
export { PROPERTY_FEATURES } from "../../../functions-shared/src/domain/real-estate/propertyFeature.enum";
export type { PropertyFeature } from "../../../functions-shared/src/domain/real-estate/propertyFeature.enum";

export { ADMIN_PERMISSIONS } from "../../../functions-shared/src/constants/permissions.const";
export { AdminAccessLevels } from "../../../functions-shared/src/domain/admin/accessLevels.const";
export { AuditAction } from "../../../functions-shared/src/enums/auditAction.enum";
export { BrazilianState } from "../../../functions-shared/src/enums/brazilianState.enum";
export type { UserAccessLevel } from "../../../functions-shared/src/types/accessLevel.type";

export {
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
} from "../../../functions-shared/src/domain/admin-tasks-board/admin-tasks-board.document";

export { default as UserSchema } from "../../../functions-shared/src/domain/user/user.schema";
export { default as CompanySchema } from "../../../functions-shared/src/domain/company/company.schema";
export type { CompanyAuditDocument } from "../../../functions-shared/src/domain/company/company-audit.document";
export { default as CompanyOperationalSchema } from "../../../functions-shared/src/domain/company/company-operational.schema";
export type { NotificationFilterDTO } from "../../../functions-shared/src/domain/notification/notification.dtos";

export {
  BUSINESS_TYPES,
  DEAL_STATUSES,
  LEAD_PREFERENCES,
  LEAD_SOURCES,
  PAYMENT_METHODS,
  PURPOSES,
  TEMPERATURES,
} from "../../../functions-shared/src/domain/lead/lead.document";
export type {
  BusinessType,
  DealStatus,
  LeadDocument,
  LeadPreference,
  LeadSource,
  PaymentMethod,
  Purpose,
  Temperature,
} from "../../../functions-shared/src/domain/lead/lead.document";
