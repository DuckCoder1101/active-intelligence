import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '@utils/firebase';
import UserService from '@services/user.service';
import { AuthContext } from '@contexts/auth.context';

import type { ReactNode } from 'react';
import type { AuthContextState } from '@contexts/auth.context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthContextState>({
    authUser: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthState((prev) => ({ ...prev, loading: true }));

      if (!user) {
        return setAuthState({
          authUser: null,
          profile: null,
          loading: false,
        });
      }

      try {
        const profile = await UserService.getMe();

        setAuthState((prev) => ({
          ...prev,
          authUser: user,
          profile,
        }));
      } catch (err) {
      } finally {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}
