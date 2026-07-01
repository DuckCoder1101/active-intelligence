import { AuthContext } from '@contexts/auth.context';
import type { AuthContextState } from '@contexts/auth.context';
import UserService from '@services/user.service';
import { onIdTokenChanged } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { pushSnackbarViaBridge } from '@/contexts/snackbar.bridge';
import type { UserProfile } from '@/models/user-profile.model';
import { createSession, deleteSession } from '@/server/session';
import type { CustomClaims } from '@/types/custom-claims.type';
import { auth } from '@/utils/firebase.util';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthContextState>({
    claims: null,
    userProfile: null,
    isLoadingProfile: true,
  });

  const downloadUserProfile = useCallback(async () => {
    let profile: UserProfile | null = null;

    try {
      setAuthState((prev) => ({ ...prev, isLoadingProfile: true }));

      profile = await UserService.getMe();
      profile.avatarUrl = await UserService.getAvatarUrl(profile.uid);
    } catch (err) {
      pushSnackbarViaBridge(mapFirebaseError(err));
    } finally {
      setAuthState((prev) => ({
        ...prev,
        isLoadingProfile: false,
        userProfile: profile,
      }));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      let claims: CustomClaims | null = null;

      if (!user) {
        await deleteSession().catch(() => {});
        return;
      }

      const idTokenResult = await user.getIdTokenResult();
      claims = idTokenResult.claims as CustomClaims;

      await createSession({ data: { idToken: idTokenResult.token } });

      setAuthState((prev) => ({ ...prev, claims }));

      if (claims.complete) {
        await downloadUserProfile();
      }
    });

    return unsubscribe;
  }, [downloadUserProfile]);

  return (
    <AuthContext.Provider value={{ ...authState, downloadUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
