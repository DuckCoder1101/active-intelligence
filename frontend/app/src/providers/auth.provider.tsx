import { AuthContext } from '@contexts/auth.context';
import type { AuthContextState } from '@contexts/auth.context';
import UserService from '@services/user.service';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FirebaseError } from 'firebase/app';
import { onIdTokenChanged } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';

import type { UserProfile } from '@/models/user-profile.model';
import { userProfileKeys } from '@/queries/user.queries';
import { createSession, deleteSession } from '@/server/session';
import type { CustomClaims } from '@/types/custom-claims.type';
import { auth } from '@/utils/firebase.util';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthContextState>({
    claims: null,
    userProfile: null,
    isLoadingProfile: true,
  });

  const downloadUserProfile = useCallback(async () => {
    let profile: UserProfile | null = null;

    try {
      setAuthState((prev) => ({
        ...prev,
        isLoadingProfile: true,
      }));

      // Routed through the query cache so concurrent triggers (e.g. two
      // `onIdTokenChanged` firings racing) dedupe into a single network call
      // instead of each doing its own `getMe` + avatar round-trip.
      profile = await queryClient.fetchQuery({
        queryKey: userProfileKeys.detail(),
        queryFn: async () => {
          const p = await UserService.getMe();
          p.avatarUrl = await UserService.getAvatarUrl(p.uid);
          return p;
        },
      });
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'functions/not-found') {
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
  }, [navigate, queryClient]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      let claims: CustomClaims | null = null;

      if (!user) {
        await deleteSession().catch(() => {});
        queryClient.removeQueries({ queryKey: userProfileKeys.all });
        // Sem usuário no SDK, nenhuma chamada sai autenticada — manter claims
        // aqui deixaria a UI fingindo sessão ativa e as callables falhariam
        // com "unauthenticated" no backend.
        setAuthState({
          claims: null,
          userProfile: null,
          isLoadingProfile: false,
        });
        return;
      }

      const idTokenResult = await user.getIdTokenResult();
      claims = idTokenResult.claims as CustomClaims;

      await createSession({
        data: {
          idToken: idTokenResult.token,
        },
      });

      setAuthState((prev) => ({
        ...prev,
        claims,
      }));

      if (claims.complete) {
        await downloadUserProfile();
      }
    });

    return unsubscribe;
  }, [downloadUserProfile, queryClient]);

  return (
    <AuthContext.Provider value={{ ...authState, downloadUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
