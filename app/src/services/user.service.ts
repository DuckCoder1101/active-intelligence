import { httpsCallable } from 'firebase/functions';
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

import { auth, functions } from '@utils/firebase';

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

  static async registerAccount(formData: RegisterUserDTO): Promise<void> {
    const result = await this.registerAccountCallable(formData);
    const customToken = result.data;

    await signInWithCustomToken(auth, customToken);
  }

  static async signinWithCredentials(
    email: string,
    password: string,
  ): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  static async signinWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
}
