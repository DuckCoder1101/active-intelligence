import {
  AuthenticatedUser,
  UserAccessLevel,
} from '@shared/types/authenticatedUser.type';
import { CallableRequest, HttpsError } from 'firebase-functions/https';

export function getAuthenticatedUser(req: CallableRequest): AuthenticatedUser {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado!');
  }

  const token = req.auth.token;
  const accessLevel = token['accessLevel'] as UserAccessLevel | undefined;

  if (!accessLevel) {
    throw new HttpsError(
      'permission-denied',
      'Faltando header de permissão. Por favor contate os desenvolvedores!',
    );
  }

  return {
    uid: req.auth.uid,
    email: token.email!,
    phone: token.phone_number,
    accessLevel: accessLevel,
  };
}
