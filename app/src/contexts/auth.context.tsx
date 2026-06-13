import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';

import type { UserProfile } from '@t/user.model';

export interface AuthContextState {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
