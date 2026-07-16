import { createContext, useContext } from 'react';

import type { UserProfile } from '@/models/user-profile.model';
import type { CustomClaims } from '@/types/custom-claims.type';

export interface AuthContextState {
  claims: CustomClaims | null;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
}

export interface AuthContextType extends AuthContextState {
  downloadUserProfile: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {throw new Error('useAuth must be used within AuthProvider');}
  return ctx;
}
