import { HttpsError } from "firebase-functions/https";
import type { CallableRequest } from "firebase-functions/https";

import { getAuthenticatedUser } from "functions-shared";

export function requireCompanyAccess(
  req: CallableRequest,
  companyId: string,
) {
  const user = getAuthenticatedUser(req);
  const isAdmin = user.accessLevel === "admin" || user.accessLevel === "owner";
  if (!isAdmin && user.companyId !== companyId) {
    throw new HttpsError(
      "permission-denied",
      "Você não tem acesso aos imóveis desta empresa.",
    );
  }
  return { uid: user.uid, companyId };
}
