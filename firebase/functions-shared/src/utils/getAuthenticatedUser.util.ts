import { AdminPermission, UserAccessLevel } from "../types/accessLevel.type";
import { AuthenticatedUser } from "../types/authenticatedUser.type";
import { CallableRequest, HttpsError } from "firebase-functions/https";

interface TokenCustomClaims {
  accessLevel?: UserAccessLevel;
  complete?: boolean;
  permissions?: AdminPermission[];
  companyId?: string;
}

export function getAuthenticatedUser(req: CallableRequest): AuthenticatedUser {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado!");
  }

  const token = req.auth.token as typeof req.auth.token & TokenCustomClaims;
  if (!token.email) {
    throw new HttpsError("unauthenticated", "Usuário sem e-mail associado!");
  }
  const accessLevel = token.accessLevel ?? "user";
  const complete = token.complete ?? false;

  const permissions = token.permissions ?? undefined;
  const companyId = token.companyId ?? undefined;

  return {
    uid: req.auth.uid,
    email: token.email,
    accessLevel,
    complete,
    permissions,
    companyId,
  };
}
