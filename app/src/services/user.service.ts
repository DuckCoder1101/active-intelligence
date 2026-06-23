import { httpsCallable } from 'firebase/functions';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { auth, functions, storage } from '@/utils/firebase.util';

import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { CompleteAccountDTO } from '@/types/dtos/user.dto';

export default class UserService {
  private static getMeCallable = httpsCallable<void, UserProfile>(
    functions,
    'getMeHandler',
  );

  private static completeAccountCallable = httpsCallable<
    CompleteAccountDTO,
    void
  >(functions, 'completeAccountHandler');

  static async getMe(): Promise<UserProfile> {
    const result = await this.getMeCallable();
    return result.data;
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

  static async signinWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  }

  static async sendRecoverPasswordEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static async sendVerificationEmail(): Promise<void> {
    await sendEmailVerification(auth.currentUser!);
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
