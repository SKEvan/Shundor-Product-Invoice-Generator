import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange } from '@/services/authService';
import { AuthContext } from './authContext';

/** Keeps track of whether the owner is signed in. The session is remembered on the device. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setSession)
      .finally(() => setLoading(false));
    return onAuthChange(setSession);
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
