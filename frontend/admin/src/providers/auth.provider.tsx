import { AuthContext } from '@contexts/auth.context';
import type { AuthContextState } from '@contexts/auth.context';
import UserService from '@services/user.service';
import { useNavigate } from '@tanstack/react-router';
import { FirebaseError } from 'firebase/app';
import { onIdTokenChanged } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';

import type { UserProfile } from '@/models/user-profile.model';
import { createSession, deleteSession } from '@/server/session';
import type { CustomClaims } from '@/types/custom-claims.type';
import { auth } from '@/utils/firebase.util';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthContextState>({
    claims: null,
    userProfile: null,
    isLoadingProfile: true,
  });

  const downloadUserProfile = useCallback(
    async (claims?: CustomClaims) => {
      let profile: UserProfile | null = null;

      setAuthState((prev) => ({
        ...prev,
        ...(claims !== undefined && { claims }),
        isLoadingProfile: true,
      }));

      try {
        profile = await UserService.getMe();
        profile.avatarUrl = await UserService.getAvatarUrl(profile.uid);
      } catch (err) {
        if (
          err instanceof FirebaseError &&
          err.code === 'functions/not-found'
        ) {
          await navigate({ to: '/auth/complete-account' });
        } else {
          toast.error(mapFirebaseError(err));
        }
      } finally {
        setAuthState((prev) => ({
          ...prev,
          isLoadingProfile: false,
          userProfile: profile,
        }));
      }
    },
    [navigate],
  );

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        await deleteSession().catch(() => {});
        return;
      }

      const idTokenResult = await user.getIdTokenResult();
      const claims = idTokenResult.claims as CustomClaims;

      await createSession({
        data: {
          idToken: idTokenResult.token,
        },
      });

      if (claims.complete) {
        await downloadUserProfile(claims);
      } else {
        setAuthState((prev) => ({
          ...prev,
          claims,
        }));
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
