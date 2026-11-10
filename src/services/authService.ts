import type { Session } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { getSupabase } from './supabaseClient';

/** "admin" → "admin@shundorproduct.app". A full email is used as-is. */
function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  return clean.includes('@') ? clean : `${clean}@${env.authEmailDomain}`;
}

export async function signIn(username: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error) {
    throw new Error(error.message === 'Invalid login credentials' ? 'Wrong username or password' : error.message);
  }
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/** Reads the saved session from the browser (no network call). */
export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
