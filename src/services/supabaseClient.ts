import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/config/env';

/**
 * The single Supabase client used by every service.
 * `null` when the env variables are missing — the app then shows a setup screen.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured. See .env.example.');
  return supabase;
}
