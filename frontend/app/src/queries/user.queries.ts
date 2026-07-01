import { useMutation } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import { FunctionsError } from 'firebase/functions';

import UserService from '@/services/user.service';
import type {
  CompleteAccountDTO,
  UpdateAccountDTO,
} from '@/types/dtos/user.dto';
import { auth } from '@/utils/firebase.util';

const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
];

interface SigninVars {
  email: string;
  password: string;
}

export function useSigninMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: SigninVars) => {
      try {
        await UserService.signin(email, password);
        return { invalidCredentials: false };
      } catch (err) {
        if (
          err instanceof FirebaseError &&
          INVALID_CREDENTIAL_CODES.includes(err.code)
        ) {
          return { invalidCredentials: true };
        }
        throw err;
      }
    },
  });
}

export function useCompleteAccountMutation() {
  return useMutation({
    mutationFn: async (data: CompleteAccountDTO) => {
      try {
        await UserService.completeAccount(data);
        await auth.currentUser?.getIdToken(true);
        return { fieldErrors: null };
      } catch (err) {
        if (err instanceof FunctionsError && err.details) {
          return { fieldErrors: err.details };
        }
        throw err;
      }
    },
  });
}

export function useUpdateAccountMutation() {
  return useMutation({
    mutationFn: (data: UpdateAccountDTO) => UserService.updateAccount(data),
  });
}

interface UpdateAvatarVars {
  uid: string;
  file: File;
}

export function useUpdateAvatarMutation() {
  return useMutation({
    mutationFn: ({ uid, file }: UpdateAvatarVars) =>
      UserService.updateAvatar(uid, file),
  });
}

export function useDeleteAvatarMutation() {
  return useMutation({
    mutationFn: (uid: string) => UserService.deleteAvatar(uid),
  });
}

export function useSendPasswordResetMutation() {
  return useMutation({
    mutationFn: (email: string) => UserService.sendRecoverPasswordEmail(email),
  });
}

export function useSignoutMutation() {
  return useMutation({
    mutationFn: () => UserService.signout(),
  });
}
