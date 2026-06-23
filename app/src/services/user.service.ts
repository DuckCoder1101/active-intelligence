import { httpsCallable } from 'firebase/functions';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { auth, functions, storage } from '@/utils/firebase.util';

import type { User } from 'firebase/auth';
import type { UserProfile, UserAccessLevel } from '@/models/user.model';
import type { AdminPermission } from '@/types/permissions.type';
import type { CompleteAccountDTO } from '@/types/dtos/user.dto';

export interface UpdateUserDTO {
  targetUid: string;
  name?: string;
  phone?: string;
}

export default class UserService {
  private static getMeCallable = httpsCallable<void, UserProfile>(
    functions,
    'getMeHandler',
  );

  private static completeAccountCallable = httpsCallable<
    CompleteAccountDTO,
    void
  >(functions, 'completeAccountHandler');

  private static listUsersCallable = httpsCallable<void, UserProfile[]>(
    functions,
    'listUsersHandler',
  );

  private static deleteUserCallable = httpsCallable<
    { targetUid: string },
    boolean
  >(functions, 'deleteUserHandler');

  private static updateUserCallable = httpsCallable<UpdateUserDTO, boolean>(
    functions,
    'updateUserHandler',
  );

  private static updateAccessLevelCallable = httpsCallable<
    { targetUid: string; newAccessLevel: UserAccessLevel },
    boolean
  >(functions, 'updateUserAccessLevel');

  private static updatePermissionsCallable = httpsCallable<
    { targetUid: string; permissions: AdminPermission[] },
    boolean
  >(functions, 'updateUserPermissionsHandler');

  private static inviteUserCallable = httpsCallable<{ email: string }, boolean>(
    functions,
    'inviteUserHandler',
  );

  static async getMe(): Promise<UserProfile> {
    const result = await this.getMeCallable();
    return result.data;
  }

  static async listUsers(): Promise<UserProfile[]> {
    const result = await this.listUsersCallable();
    return result.data;
  }

  static async deleteUser(uid: string): Promise<void> {
    await this.deleteUserCallable({ targetUid: uid });
  }

  static async updateUser(data: UpdateUserDTO): Promise<void> {
    await this.updateUserCallable(data);
  }

  static async updateAccessLevel(
    uid: string,
    newAccessLevel: UserAccessLevel,
  ): Promise<void> {
    await this.updateAccessLevelCallable({ targetUid: uid, newAccessLevel });
  }

  static async updatePermissions(
    uid: string,
    permissions: AdminPermission[],
  ): Promise<void> {
    await this.updatePermissionsCallable({ targetUid: uid, permissions });
  }

  static async completeAccount(formData: CompleteAccountDTO): Promise<User> {
    await this.completeAccountCallable(formData);
    await auth.currentUser!.getIdToken(true);
    return auth.currentUser!;
  }

  static async signinWithCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  static async inviteUser(email: string): Promise<void> {
    await this.inviteUserCallable({ email });
    await this.sendRecoverPasswordEmail(email);
  }

  static async sendRecoverPasswordEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static async signout(): Promise<void> {
    await signOut(auth);
  }

  static async getProfilePhotoUrl(uid: string): Promise<string | null> {
    try {
      const photoRef = ref(storage, `users/${uid}/profile`);
      return await getDownloadURL(photoRef);
    } catch {
      return null;
    }
  }

  static async updateProfilePhoto(uid: string, file: File): Promise<string> {
    const photoRef = ref(storage, `users/${uid}/profile`);
    await uploadBytes(photoRef, file);
    return await getDownloadURL(photoRef);
  }
}
