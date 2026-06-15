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
  const accessLevel = (token['accessLevel'] as UserAccessLevel) ?? 'client';

  return {
    uid: req.auth.uid,
    email: token.email!,
    phone: token.phone_number,
    accessLevel: accessLevel,
  };
}
