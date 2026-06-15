import { onIdTokenChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import UserService from '@services/user.service';
import { AuthContext } from '@contexts/auth.context';
import { useHandleError } from '@/hooks/useHandleError.util';
import { auth } from '@/utils/firebase.util';
import { createSession, deleteSession } from '@/server/session';

import type { ReactNode } from 'react';
import type { AuthContextState } from '@contexts/auth.context';
import type { UserProfile } from '@/types/user.model';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const handleError = useHandleError();

  const [authState, setAuthState] = useState<AuthContextState>({
    authUser: null,
    profile: null,
    isLoadingProfile: true,
    isSessionReady: false,
  });

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      let profile: UserProfile | null = null;

      try {
        setAuthState((prev) => ({ ...prev, isLoadingProfile: true }));

        if (user) {
          const idToken = await user.getIdToken();
          await createSession({ data: { idToken } });
          profile = await UserService.getMe();
        } else {
          await deleteSession();
        }
      } catch (err) {
        handleError(err);
      } finally {
        setAuthState({
          authUser: user,
          profile,
          isLoadingProfile: false,
          isSessionReady: true,
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}
