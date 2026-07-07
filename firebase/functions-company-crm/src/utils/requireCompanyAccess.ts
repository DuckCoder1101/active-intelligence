import { HttpsError, CallableRequest } from 'firebase-functions/https';
import { getAuthenticatedUser } from 'functions-shared';

export function requireCompanyAccess(
  req: CallableRequest,
  companyId: string,
): { uid: string; companyId: string } {
  const user = getAuthenticatedUser(req);

  const isAdmin = user.accessLevel === 'admin' || user.accessLevel === 'owner';

  if (!isAdmin && user.companyId !== companyId) {
    throw new HttpsError(
      'permission-denied',
      'Você não tem acesso ao CRM desta empresa.',
    );
  }

  return { uid: user.uid, companyId };
}
