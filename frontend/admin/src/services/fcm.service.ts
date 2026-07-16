import { httpsCallable } from 'firebase/functions';

import { functions } from '@/utils/firebase.util';

let currentToken: string | null = null;

export default class FcmService {
  private static registerCallable = httpsCallable<{ token: string }, boolean>(
    functions,
    'registerFcmTokenHandler',
  );

  private static unregisterCallable = httpsCallable<
    { token: string },
    boolean
  >(functions, 'unregisterFcmTokenHandler');

  static async registerToken(token: string): Promise<void> {
    if (token === currentToken) {return;}

    await this.registerCallable({ token });
    currentToken = token;
  }

  static async unregisterCurrentToken(): Promise<void> {
    if (!currentToken) {return;}

    const token = currentToken;
    currentToken = null;
    await this.unregisterCallable({ token });
  }
}
