import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  /** True only while the saved session is being read on startup. */
  loading: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);
