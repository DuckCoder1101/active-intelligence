import { onIdTokenChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import UserService from '@services/user.service';
import { AuthContext } from '@contexts/auth.context';
import { useHandleError } from '@/hooks/useHandleError.util';
import { auth } from '@/utils/firebase.util';
import { createSession, deleteSession } from '@/server/session';

import type { ReactNode } from 'react';
import type { AuthContextState } from '@contexts/auth.context';
import type { CustomClaims } from '@t/session.type';
import type { UserProfile } from '@/models/user.model';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const handleError = useHandleError();

  const [authState, setAuthState] = useState<AuthContextState>({
    claims: null,
    profile: null,
    isLoadingProfile: true,
    isSessionReady: false,
  });

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      let claims: CustomClaims | null = null;
      let profile: UserProfile | null = null;

      try {
        setAuthState((prev) => ({ ...prev, isLoadingProfile: true }));

        if (user) {
          const idTokenResult = await user.getIdTokenResult();
          claims = idTokenResult.claims as CustomClaims;

          await createSession({
            data: {
              idToken: idTokenResult.token,
            },
          });

          if (claims.complete) {
            profile = await UserService.getMe();
          }
        } else {
          await deleteSession();
        }
      } catch (err) {
        handleError(err);
      } finally {
        setAuthState({
          claims,
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
