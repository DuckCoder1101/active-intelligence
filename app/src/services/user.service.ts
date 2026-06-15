import { httpsCallable } from 'firebase/functions';
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';

import { auth, functions } from '@/utils/firebase.util';

import type { User } from 'firebase/auth';
import type { UserProfile } from '@t/user.model';
import type { RegisterUserDTO } from '@t/user.dto';

export default class UserService {
  private static getMeCallable = httpsCallable<void, UserProfile>(
    functions,
    'getMeHandler',
  );

  private static registerAccountCallable = httpsCallable<
    RegisterUserDTO,
    string
  >(functions, 'registerAccountHandler');

  static async getMe(): Promise<UserProfile> {
    const result = await this.getMeCallable();
    return result.data;
  }

  static async registerAccount(formData: RegisterUserDTO): Promise<User> {
    const result = await this.registerAccountCallable(formData);
    const customToken = result.data;
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user;
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
}
