import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';

import type { CustomClaims } from '@t/session.type';
import type { UserProfile } from '@/models/user.model';

export type AuthUser = User & { claims: CustomClaims };

export interface AuthContextState {
  authUser: AuthUser | null;
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  isSessionReady: boolean;
}

export const AuthContext = createContext<AuthContextState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
