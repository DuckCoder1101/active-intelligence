import { createContext, useContext } from 'react';

import type { UserProfile } from '@/models/user.model';
import type { CustomClaims } from '@t/session.type';

export interface AuthContextState {
  claims: CustomClaims | null;
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
