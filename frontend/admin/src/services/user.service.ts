import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

import type { UserProfile } from '@/models/user-profile.model';
import type {
  CompleteAccountDTO,
  DeleteAccountDTO,
  UpdateAccountDTO,
} from '@/types/dtos/user.dto';
import { auth, functions, storage } from '@/utils/firebase.util';

export default class UserService {
  private static getMeCallable = httpsCallable<void, UserProfile>(
    functions,
    'getMeHandler',
  );

  private static completeAccountCallable = httpsCallable<
    CompleteAccountDTO,
    void
  >(functions, 'completeProfileHandler');

  private static updateAccountCallable = httpsCallable<UpdateAccountDTO, void>(
    functions,
    'updateProfileHandler',
  );

  private static deleteAccountCallable = httpsCallable<DeleteAccountDTO, void>(
    functions,
    'deleteAccountHandler',
  );

  static async getMe(): Promise<UserProfile> {
    const result = await this.getMeCallable();
    return result.data;
  }

  static async signin(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  static async sendRecoverPasswordEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static async completeAccount(data: CompleteAccountDTO): Promise<void> {
    await this.completeAccountCallable(data);
  }

  static async signout(): Promise<void> {
    await signOut(auth);
  }

  static async updateAccount(data: UpdateAccountDTO): Promise<void> {
    await this.updateAccountCallable(data);
  }

  static async deleteAccount(data: DeleteAccountDTO): Promise<void> {
    await this.deleteAccountCallable(data);
  }

  static async getAvatarUrl(uid: string): Promise<string | null> {
    try {
      const photoRef = ref(storage, `users/${uid}/avatar`);
      return await getDownloadURL(photoRef);
    } catch {
      return null;
    }
  }

  static async updateAvatar(uid: string, file: File): Promise<string> {
    const photoRef = ref(storage, `users/${uid}/avatar`);

    await uploadBytes(photoRef, file);
    return await getDownloadURL(photoRef);
  }

  static async deleteAvatar(uid: string): Promise<void> {
    const photoRef = ref(storage, `users/${uid}/avatar`);
    await deleteObject(photoRef);
  }
}
